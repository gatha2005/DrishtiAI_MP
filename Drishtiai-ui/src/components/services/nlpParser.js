export function extractFeatures(text) {

    const input = text.toLowerCase();

    const features = {
        gender: "",
        age: "",
        hairColor: "",
        hairLength: "",
        beard: false,
        moustache: false,
        glasses: false,
        eyeColor: "",
        faceShape: "",
        skinTone: "",
        clothing: ""
    };


    // Gender
    if (
        input.includes("male") ||
        input.includes("mail") ||
        input.includes("man") ||
        input.includes("boy")
    ) {
        features.gender = "Male";
    }

    if (
        input.includes("female") ||
        input.includes("woman") ||
        input.includes("girl") ||
        input.includes("lady")
    ) {
        features.gender = "Female";
    }

    // Beard
    if (
        input.includes("beard") ||
        input.includes("bearded") ||
        input.includes("bearded") ||
        input.includes("weird")      // speech recognition sometimes hears beard as weird
    ) {
        features.beard = true;
    }

    // Moustache
    if (
        input.includes("moustache") ||
        input.includes("mustache") ||
        input.includes("mustached")
    ) {
        features.moustache = true;
    }

    // Glasses
    if (
        input.includes("glasses") ||
        input.includes("glass") ||
        input.includes("spectacles") ||
        input.includes("goggles")
    ) {
        features.glasses = true;
    }

    // Hair Length
    if (
        input.includes("short hair") ||
        input.includes("short") ||
        input.includes("sort hair") ||
        input.includes("salt hair")
    )
    {
        features.hairLength = "Short";
    }

    if (input.includes("long"))
        features.hairLength = "Long";

    // Hair Color
    if (input.includes("black hair"))
        features.hairColor = "Black";
    else if (input.includes("brown hair"))
        features.hairColor = "Brown";
    else if (input.includes("blonde hair"))
        features.hairColor = "Blonde";
    else if (input.includes("white hair"))
        features.hairColor = "White";

    // Eye Color
    if (input.includes("brown eyes"))
        features.eyeColor = "Brown";

    if (input.includes("black eyes"))
        features.eyeColor = "Black";

    if (input.includes("blue eyes"))
        features.eyeColor = "Blue";

    if (input.includes("green eyes"))
        features.eyeColor = "Green";

    // Face Shape
    if (input.includes("round face"))
        features.faceShape = "Round";

    if (input.includes("oval face"))
        features.faceShape = "Oval";

    if (input.includes("square face"))
        features.faceShape = "Square";
    if (input.includes("heart face"))
        features.faceShape = "Heart";
    if (input.includes("diamond face"))
        features.faceShape = "Diamond";

    // Skin Tone
    if (input.includes("fair"))
        features.skinTone = "Fair";

    if (input.includes("dark"))
        features.skinTone = "Dark";

    if (input.includes("wheatish"))
        features.skinTone = "Wheatish";

    // Clothing
    if (input.includes("blue"))
        features.clothing = "Blue";

    if (input.includes("red"))
        features.clothing = "Red";

    if (input.includes("black jacket"))
        features.clothing = "Black Jacket";

    if (input.includes("white shirt"))
        features.clothing = "White Shirt";

    // Age

    const ageMatch = input.match(/\b(\d{1,3})\b/);

    if (ageMatch) {
        features.age = ageMatch[1];
    }

    return features;
}