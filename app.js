
// Font Manager

const fontUpload = document.getElementById("font-upload");
const fontList = document.getElementById("font-list");
const fontSelects = document.querySelectorAll(".font-select");

const loadedFonts = [];

// Upload fonts

fontUpload.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files);

    for (const file of files) {
        const fontName = file.name.replace(/\.[^/.]+$/, "");

        // Avoid duplicate fonts
        if (loadedFonts.some(font => font.name === fontName)) {
            continue;
        }

        const fontFace = new FontFace(
            fontName,
            `url("${URL.createObjectURL(file)}")`
        );

        try {
            await fontFace.load();
            document.fonts.add(fontFace);

            loadedFonts.push({
                name: fontName,
                file: file
            });

            updateFontList();
            updateFontSelects();

        } catch (error) {
            console.error(`Failed to load font: ${fontName}`, error);
        }
    }

    fontUpload.value = "";
});

// Update font list

function updateFontList() {
    fontList.replaceChildren();

    if (loadedFonts.length === 0) {
        fontList.textContent = "尚未載入字體";
        return;
    }

    loadedFonts.forEach(font => {
        const item = document.createElement("p");
        item.textContent = font.name;
        fontList.appendChild(item);
    });
}

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
        const fontSizeValue = block.querySelector(".font-size-value");
        const fontWeightValue = block.querySelector(".font-weight-value");
        const textarea = block.querySelector("textarea");

        const previewText = document.createElement("p");

        previewText.textContent = textarea.value;

        previewText.style.fontFamily = fontSelect.value
            ? `"${fontSelect.value}"`
            : "inherit";

        previewText.style.fontSize = `${fontSize.value}px`;
        previewText.style.fontWeight = fontWeight.value;

        fontSizeValue.textContent = fontSize.value;
        fontWeightValue.textContent = fontWeight.value;

        previewArea.appendChild(previewText);
    });
}

// Listen for editor changes

document.addEventListener("input", event => {
    if (
        event.target.matches(".font-select") ||
        event.target.matches(".font-size") ||
        event.target.matches(".font-weight") ||
        event.target.matches(".editor-block textarea")
    ) {
        updatePreview();
    }
});

document.addEventListener("change", event => {
    if (event.target.matches(".font-select")) {
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
    newBlock.querySelector(".font-select").value = "";
    newBlock.querySelector(".font-size").value = "24";
    newBlock.querySelector(".font-weight").value = "400";
    newBlock.querySelector(".font-size-value").textContent = "24";
    newBlock.querySelector(".font-weight-value").textContent = "400";
    newBlock.querySelector("textarea").value = "";
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
