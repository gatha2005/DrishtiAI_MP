// Converts NLP features into sketch component images

export function mapFeaturesToImages(features) {

    const images = {};

    // FACE
    if (features.gender === "Male") {
        images.face = "/assets/face_structure/face1.jpeg";
    } else {
        images.face = "/assets/face_structure/face6.jpeg";
    }

    // HAIR
    if (features.hairLength === "Short") {
        images.hair = "/assets/hair/hair2.jpeg";
    } else if (features.hairLength === "Long") {
        images.hair = "/assets/hair/hair8.jpeg";
    } else {
        images.hair = "/assets/hair/hair1.jpeg";
    }

    // EYES
    if (features.eyeColor === "Brown") {
        images.eyes = "/assets/eye/eyes2.jpeg";
    } else if (features.eyeColor === "Blue") {
        images.eyes = "/assets/eye/eyes5.jpeg";
    } else {
        images.eyes = "/assets/eye/eyes1.jpeg";
    }

    // NOSE
    images.nose = "/assets/nose/nose1.jpeg";

    // LIPS
    images.lips = "/assets/lips/lip2.png";

    return images;
}