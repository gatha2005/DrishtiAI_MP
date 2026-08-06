export function selectComponents(features) {

    let selected = {};

    //---------------- FACE ----------------

    if (features.gender === "Male") {

        if (features.age <= 25)
            selected.face = "/assets/face_structure/face2.jpeg";

        else if (features.age <= 40)
            selected.face = "/assets/face_structure/face4.jpeg";

        else
            selected.face = "/assets/face_structure/face7.png";

    }

    else {

        selected.face = "/assets/face_structure/face8.jpeg";

    }

    //---------------- HAIR ----------------

    if (features.hairColor === "Black") {

        if (features.hairLength === "Short")
            selected.hair = "/assets/hair/hair7.jpeg";

        else
            selected.hair = "/assets/hair/hair4.jpeg";

    }

    else if (features.hairColor === "Brown") {

        selected.hair = "/assets/hair/hair5.jpeg";

    }

    else {

        selected.hair = "/assets/hair/hair1.jpeg";

    }

    //---------------- EYES ----------------

    if (features.eyeColor === "Brown")
        selected.eyes = "/assets/eye/eyes5.jpeg";

    else if (features.eyeColor === "Blue")
        selected.eyes = "/assets/eye/eyes8.jpeg";

    else
        selected.eyes = "/assets/eye/eyes2.jpeg";

    //---------------- NOSE ----------------

    selected.nose = "/assets/nose/nose2.jpeg";

    //---------------- LIPS ----------------

    selected.lips = "/assets/lips/lip3.png";

    return selected;
}