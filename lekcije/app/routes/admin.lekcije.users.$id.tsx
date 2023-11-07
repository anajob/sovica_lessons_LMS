import { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import {
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { prisma } from "~/db.server";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import Input from "~/components/Input";
import { Link, redirect } from "react-router-dom";
import {
  ensureAuthenticated,
  getAuthenticatedUserId,
} from "~/admin-session.server";
import { useRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { uploadImageToCloudinary } from "~/utils/util.server";
import { useProfileImageHandling } from "~/utils/generateUrl";
import { adminUser } from "@prisma/client";

type ValidResult = {
  isValid: true;
  validPayload: {
    email: string;
    nickName: string;
    img: File | null;
    removeImg: boolean;
  };
};

type InvalidResult = {
  isValid: false;
  validationErrors: string[];
};

type ValidationResult = ValidResult | InvalidResult;

function validateUserUpdatePayload(formData: FormData): ValidationResult {
  const validationErrors = [];
  const nickName = formData.get("nickName");
  let email = formData.get("email");
  let submittedImage = formData.get("img");
  const imgRemoving = formData.get("imgRemoving");

  // Email validation
  if (typeof email !== "string") {
    validationErrors.push("email must be a string");
  } else {
    email = email.toLowerCase();
    if (email.length < 6) {
      validationErrors.push("email must be at least 6 characters long");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    if (!isValid) {
      validationErrors.push("email is not valid");
    }
  }

  // Nick name validation
  if (typeof nickName !== "string") {
    validationErrors.push("nickname must be a string");
  } else {
    if (nickName.length < 3) {
      validationErrors.push("nickname must be at least 3 characters long");
    }
  }

  // Image validation
  if (!(submittedImage instanceof File)) {
    validationErrors.push(`img is not a file`);
  }

  if (
    submittedImage instanceof File &&
    submittedImage.size > 0 &&
    imgRemoving === "2"
  ) {
    validationErrors.push(
      "can't upload an image and remove it at the same time"
    );
  }

  if (validationErrors.length > 0) {
    return {
      isValid: false,
      validationErrors: validationErrors,
    };
  } else {
    return {
      isValid: true,
      validPayload: {
        email: email as string,
        nickName: nickName as string,
        img:
          (submittedImage as File).size > 0 ? (submittedImage as File) : null,
        removeImg: imgRemoving === "2",
      },
    };
  }
}
async function deleteEditor(editorIdFromParams: number) {
  await prisma.adminUser.delete({
    where: {
      id: editorIdFromParams,
    },
  });
}

async function updateEditor(
  editor: adminUser,
  payload: {
    nickName: string;
    email: string;
    img: File | null;
    removeImg: boolean;
  }
) {
  let imgUrl = null;
  let imgPublicId = null;
  if (payload.img !== null) {
    const cloudinaryImage = await uploadImageToCloudinary(payload.img.stream());
    imgUrl = cloudinaryImage.secure_url;
    imgPublicId = cloudinaryImage.public_id;
  } else if (payload.removeImg) {
    imgUrl = null;
  } else {
    imgUrl = editor.imgUrl;
  }

  await prisma.adminUser.update({
    where: { id: editor.id },
    data: {
      nickName: payload.nickName,
      email: payload.email,
      public_id: imgPublicId,
      imgUrl: imgUrl,
    },
  });
}

export const action = async function ({ request, params }: ActionArgs) {
  await ensureAuthenticated(request);

  const uploadHandler = createMemoryUploadHandler({ maxPartSize: 6000000 });
  const formData = await parseMultipartFormData(request, uploadHandler);
  const action = formData.get("_action");

  if (action === "DELETE") {
    deleteEditor(parseInt(params.id as string));
    return redirect("/admin/lekcije/users");
  } else {
    const editor = await prisma.adminUser.findUnique({
      where: {
        id: parseFloat(params.id as string),
      },
    });
    if (!editor) {
      throw new Error(`editor need to be object, got null`);
    }
    const validationResult = validateUserUpdatePayload(formData);
    if (!validationResult.isValid) {
      return json({
        validationErrors: validationResult.validationErrors,
      });
    }

    updateEditor(editor, {
      nickName: validationResult.validPayload.nickName,
      email: validationResult.validPayload.email,
      img: validationResult.validPayload.img,
      removeImg: validationResult.validPayload.removeImg,
    });
    return redirect("/admin/lekcije/users");
  }
};

export const loader = async function ({ request, params }: LoaderArgs) {
  await ensureAuthenticated(request);

  const userId = await getAuthenticatedUserId(request);
  if (userId === null) {
    throw new Error(`userId must be number, got null`);
  }
  const loggedInUser = await prisma.adminUser.findUnique({
    where: {
      id: userId,
    },
  });
  if (loggedInUser === null) {
    throw new Error(`user must be object, got null`);
  }
  const nickName = loggedInUser.nickName;
  if (params.id === undefined) {
    throw new Error(`params id need to be string, got undefined`);
  }
  const editor = await prisma.adminUser.findUnique({
    where: {
      id: parseFloat(params.id),
    },
  });
  return json({
    editor: editor,
    nickName: nickName,
  });
};

export default function User() {
  const dataFromJson = useLoaderData<typeof loader>();
  const editor = dataFromJson.editor;
  const nickName = dataFromJson.nickName;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownToggleRef = useRef<HTMLDivElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (editor === null) {
    throw new Error(`editor should be object, got null`);
  }

  let { previewImgUrl, processImage, handleImgRemoving } =
    useProfileImageHandling(editor);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const [rmvImgFromDatabase, setRmvImgFromDatabase] = useState("1");

  function handleRemovingFromDatabase() {
    setRmvImgFromDatabase("2");
    fileInputRef.current!.value = "";
  }

  return (
    <div className="wrapper">
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item  ml-5">
                <Link to="/admin/lekcije">Lekcije</Link>
              </li>
              <li className="breadcrumb-item  ml-5">
                <Link to="/admin/lekcije/users">Editori</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Profil Editora
              </li>
            </ol>
          </nav>
          <div className="dropdown">
            <div
              ref={dropdownToggleRef}
              className="dropdown-toggle d-flex align-items-center justify-content-center"
            >
              <img
                className="img-fluid media-object rounded-circle"
                src="/avatar.jpg"
                alt="Avatar"
                style={{ width: "40" + "px", height: "40" + "px" }}
              />
              <h6>{nickName}</h6>
            </div>
            {isOpen && (
              <div className="dropdown-content">
                <div className="dropdown-item">
                  <form className="logout" action="/admin/logout" method="post">
                    <button type="submit" className="btn btn-sm btn-link">
                      Odjavi se
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card form-holder">
        <div className="card-body">
          <Form
            method="post"
            className="container-lg"
            encType="multipart/form-data"
          >
            <div className="imgContainer d-flex mb-3">
              <img className="editorImg" src={previewImgUrl} />
              <div className="d-flex align-items-center">
                {" "}
                <label id="imageLabel" htmlFor="img">
                  Nova slika
                </label>
                <input
                  id="img"
                  type="file"
                  name="img"
                  accept="image/*"
                  onChange={processImage}
                  ref={fileInputRef}
                />
                <input type="hidden" name="public_id" />
                <input
                  type="hidden"
                  name="imgRemoving"
                  value={rmvImgFromDatabase}
                />
                <button
                  style={{ color: "#2c5a53" }}
                  className="btn btn-outline plain-btn"
                  onClick={() => {
                    handleImgRemoving();
                    handleRemovingFromDatabase();
                  }}
                  type="button"
                >
                  <span>/</span>
                  Ukloni sliku
                </button>
              </div>
            </div>

            <Input
              name="nickName"
              type="text"
              defaultValue={editor.nickName}
              label="Korisnicko ime"
            />
            <Input
              name="email"
              type="email"
              defaultValue={editor.email}
              label="Imejl"
            />
            <div className="d-flex justify-content-between">
              <button
                name="_action"
                value="UPDATE"
                className="btn btn-outline-success mt-2"
                type="submit"
              >
                Sacuvaj
              </button>
              <button
                className="btn btn-outline-danger disabled: mt-2"
                onClick={openModal}
                disabled={showModal}
              >
                Obrisi
              </button>
            </div>
          </Form>
          <Modal show={showModal} onHide={closeModal}>
            <Modal.Header closeButton>
              <Modal.Title>Potvrdi brisanje</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Da li ste sigurni da želite da obrišete korisnika?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>
                Odustani
              </Button>
              <form method="post" encType="multipart/form-data">
                <Button
                  type="submit"
                  value="DELETE"
                  variant="outline-danger"
                  name="_action"
                >
                  Obriši
                </Button>
              </form>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}
