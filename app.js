
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
