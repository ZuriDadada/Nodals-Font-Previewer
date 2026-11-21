
// Font Manager

const fontUpload = document.getElementById("font-upload");
const fontList = document.getElementById("font-list");
const fontSelects = document.querySelectorAll(".font-select");

const loadedFonts = [];

// Load a font

async function loadFont(blob, fontName, file = null) {
    // Avoid duplicate fonts
    if (loadedFonts.some(font => font.name === fontName)) {
        return false;
    }

    const objectURL = URL.createObjectURL(blob);

    const fontFace = new FontFace(
        fontName,
        `url("${objectURL}")`
    );

    try {
        await fontFace.load();
        document.fonts.add(fontFace);

        loadedFonts.push({
            name: fontName,
            file: file,
            fontFace: fontFace,
            objectURL: objectURL
        });

        updateFontList();
        updateFontSelects();

        return true;

    } catch (error) {
        URL.revokeObjectURL(objectURL);
        console.error(`Failed to load font: ${fontName}`, error);

        return false;
    }
}

// Load fonts from ZIP

async function loadZip(file, fileName = "遠端 ZIP") {
    const maxZipSize = 20 * 1024 * 1024;
    const maxExtractedSize = 100 * 1024 * 1024;

    if (file.size > maxZipSize) {
        console.warn("ZIP file is too large:", fileName);
        return;
    }

    try {
        const zip = await JSZip.loadAsync(file);

        const fontFiles = Object.values(zip.files).filter(entry => {
            return (
                !entry.dir &&
                /\.(ttf|otf|woff2?)$/i.test(entry.name)
            );
        });

        if (fontFiles.length === 0) {
            console.warn("No supported fonts found:", fileName);
            return;
        }

        // Check total uncompressed size
        const totalSize = fontFiles.reduce((total, entry) => {
            return total + (entry._data?.uncompressedSize || 0);
        }, 0);

        if (totalSize > maxExtractedSize) {
            console.warn("Extracted fonts are too large:", fileName);
            return;
        }

        for (const entry of fontFiles) {
            const blob = await entry.async("blob");

            const fontFileName = entry.name.split("/").pop();
            const fontName = fontFileName.replace(/\.[^/.]+$/, "");

            await loadFont(blob, fontName);
        }

    } catch (error) {
        console.error("Failed to load ZIP:", fileName, error);
    }
                            }

// Upload fonts

fontUpload.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);

    for (const file of files) {
    if (/\.zip$/i.test(file.name)) {
        await loadZip(file, file.name);
    } else {
        const fontName = file.name.replace(/\.[^/.]+$/, "");

        await loadFont(file, fontName, file);
    }
    }

    fontUpload.value = "";
});

// Load font from URL

const fontURL = document.getElementById("font-url");
const loadFontURLButton = document.getElementById("load-font-url");
const fontURLStatus = document.getElementById("font-url-status");

loadFontURLButton.addEventListener("click", async () => {
    const url = fontURL.value.trim();

    if (!url) {
        fontURLStatus.textContent = "請先輸入字體下載地址";
        return;
    }

    let objectURL;

    try {
        const parsedURL = new URL(url);

        if (
            parsedURL.protocol !== "https:" &&
            parsedURL.protocol !== "http:"
        ) {
            throw new Error("不支援的網址格式");
        }

        const fileName = decodeURIComponent(
            parsedURL.pathname.split("/").pop()
        );

        const fontName = fileName.replace(/\.[^/.]+$/, "") || "遠端字體";

        if (loadedFonts.some(font => font.name === fontName)) {
            fontURLStatus.textContent = "這個字體已經載入了";
            return;
        }

        fontURLStatus.textContent = "正在載入……";
        loadFontURLButton.disabled = true;

        const response = await fetch(parsedURL.href);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        objectURL = URL.createObjectURL(blob);

        const fontFace = new FontFace(
            fontName,
            `url("${objectURL}")`
        );

        await fontFace.load();
        document.fonts.add(fontFace);

        loadedFonts.push({
            name: fontName,
            file: null,
            fontFace: fontFace,
            objectURL: objectURL
        });

        updateFontList();
        updateFontSelects();

        fontURLStatus.textContent = "字體載入成功！";
        fontURL.value = "";

    } catch (error) {
        if (objectURL) {
            URL.revokeObjectURL(objectURL);
        }

        fontURLStatus.textContent =
            "載入失敗，請檢查網址或伺服器的跨來源存取設定";

        console.error("Failed to load remote font:", error);

    } finally {
        loadFontURLButton.disabled = false;
    }
});

// Update font list

function updateFontList() {
    fontList.replaceChildren();

    if (loadedFonts.length === 0) {
        fontList.textContent = "尚未載入字體";
        return;
    }

    loadedFonts.forEach(font => {
        const item = document.createElement("div");
        item.className = "font-item";

        const name = document.createElement("span");
        name.textContent = font.name;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-font";
        deleteButton.textContent = "刪除";
        deleteButton.dataset.fontName = font.name;

        item.appendChild(name);
        item.appendChild(deleteButton);

        fontList.appendChild(item);
    });
}

// Delete loaded font

fontList.addEventListener("click", event => {
    if (!event.target.matches(".delete-font")) {
        return;
    }

    const fontName = event.target.dataset.fontName;

    const index = loadedFonts.findIndex(
        font => font.name === fontName
    );

    if (index === -1) {
        return;
    }

    const font = loadedFonts[index];

    document.fonts.delete(font.fontFace);
    URL.revokeObjectURL(font.objectURL);

    loadedFonts.splice(index, 1);

    updateFontList();
    updateFontSelects();
    updatePreview();
});

// Update font selectors

function updateFontSelects() {
    document.querySelectorAll(".font-select").forEach(select => {
        const selectedFont = select.value;

        select.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "請選擇字體";
        select.appendChild(defaultOption);

        loadedFonts.forEach(font => {
            const option = document.createElement("option");
            option.value = font.name;
            option.textContent = font.name;
            select.appendChild(option);
        });

        select.value = loadedFonts.some(font => font.name === selectedFont)
            ? selectedFont
            : "";
    });
}

// Update font preview

function updatePreview() {
    const previewArea = document.getElementById("preview-area");
    const editorBlocks = document.querySelectorAll(".editor-block");

    previewArea.replaceChildren();

    editorBlocks.forEach(block => {
        const fontSelect = block.querySelector(".font-select");
        const fontSize = block.querySelector(".font-size");
        const fontWeight = block.querySelector(".font-weight");
        const textarea = block.querySelector("textarea");

        const previewText = document.createElement("p");

        previewText.textContent = textarea.value;

        previewText.style.fontFamily = fontSelect.value
            ? `"${fontSelect.value}"`
            : "inherit";

        previewText.style.fontSize = `${fontSize.value}px`;
        previewText.style.fontWeight = fontWeight.value;

        previewArea.appendChild(previewText);
    });
}

// Listen for editor changes

document.addEventListener("input", event => {
    const target = event.target;
    const block = target.closest(".editor-block");

    if (!block) {
        return;
    }

    if (target.matches(".font-size")) {
        block.querySelector(".font-size-number").value = target.value;
        updatePreview();
    } else if (target.matches(".font-size-number")) {
        if (target.value !== "") {
            block.querySelector(".font-size").value = target.value;
        }
        updatePreview();
    } else if (target.matches(".font-weight")) {
        block.querySelector(".font-weight-number").value = target.value;
        updatePreview();
    } else if (target.matches(".font-weight-number")) {
        if (target.value !== "") {
            block.querySelector(".font-weight").value = target.value;
        }
        updatePreview();
    } else if (
        target.matches(".font-select") ||
        target.matches(".editor-block textarea")
    ) {
        updatePreview();
    }
});

document.addEventListener("change", event => {
    const target = event.target;

    if (target.matches(".font-select")) {
        updatePreview();
    }

    if (
        target.matches(".font-size-number") ||
        target.matches(".font-weight-number")
    ) {
        const block = target.closest(".editor-block");
        const range = target.matches(".font-size-number")
            ? block.querySelector(".font-size")
            : block.querySelector(".font-weight");

        target.value = range.value;
        updatePreview();
    }
});

// Add editor block

const addBlockButton = document.getElementById("add-block");
const editorBlocks = document.getElementById("editor-blocks");

// Create delete buttons

function updateDeleteButtons() {
    document.querySelectorAll(".editor-block").forEach(block => {
        let deleteButton = block.querySelector(".delete-block");

        if (!deleteButton) {
            deleteButton = document.createElement("button");
            deleteButton.className = "delete-block";
            deleteButton.textContent = "刪除區塊";

            block.appendChild(deleteButton);
        }
    });
}

// Add initial delete button

updateDeleteButtons();

// Add new editor block

addBlockButton.addEventListener("click", () => {
    const newBlock = document.querySelector(".editor-block").cloneNode(true);

    newBlock.querySelector(".font-select").value = "";
    newBlock.querySelector(".font-size").value = "24";
    newBlock.querySelector(".font-weight").value = "400";
    newBlock.querySelector(".font-size-number").value = "24";
    newBlock.querySelector(".font-weight-number").value = "400";
    newBlock.querySelector("textarea").value = "";

    editorBlocks.appendChild(newBlock);

    updateFontSelects();
    updatePreview();
});

// Delete editor block

editorBlocks.addEventListener("click", event => {
    if (event.target.matches(".delete-block")) {
        const blocks = document.querySelectorAll(".editor-block");

        // Keep at least one editor block
        if (blocks.length <= 1) {
            return;
        }

        event.target.closest(".editor-block").remove();

        updatePreview();
    }
});
