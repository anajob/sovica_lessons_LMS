import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import {
  json,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
  redirect,
} from "@remix-run/server-runtime";
import {
  authenticateAdminUser,
  ensureAuthenticated,
  getAuthenticatedUserId,
} from "~/admin-session.server";
import { prisma } from "~/db.server";
import { useRef, useState } from "react";
import bcrypt from "bcryptjs";
import Input from "~/components/Input";
import { useInsideOutsideClick } from "~/utils/useInsideOutsideClick";
import { validateUserCreatePayload } from "~/utils/validateUserCreate";
import { uploadImageToCloudinary } from "~/utils/util.server";
import { useProfileImageHandling } from "~/utils/generateUrl";
import { generateRandomPassword } from "~/utils/generateRandomPassword";

export const loader = async function loader({ request, params }: LoaderArgs) {
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

  return json({ nickName: nickName });
};

export const action = async function ({ request }: ActionArgs) {
  const uploadHandler = createMemoryUploadHandler({ maxPartSize: 6000000 });
  const formData = await parseMultipartFormData(request, uploadHandler);

  let imgUrl: string | null = null;
  let imgPublicId: string | null = null;
  let submittedImage = formData.get("img");
  if (!(submittedImage instanceof File)) {
    throw new Error(`img is not a file`);
  }
  if (submittedImage.size) {
    const cloudinaryImage = await uploadImageToCloudinary(
      submittedImage.stream()
    );
    imgUrl = cloudinaryImage.secure_url;
    imgPublicId = cloudinaryImage.public_id;
  } else {
    imgUrl = null;
  }
  const email = formData.get("email");
  const password = formData.get("password");
  const nickName = formData.get("nickName");

  const validationResult = validateUserCreatePayload({
    email: email,
    password: password,
    nickName: nickName,
  });
  if (!validationResult.isValid) {
    return json({
      validationErrors: validationResult.validationErrors,
    });
  }

  const userInDatabasee = await prisma.adminUser.findFirst({
    where: {
      email: validationResult.validPayload.email,
    },
  });

  if (userInDatabasee !== null) {
    return json({
      validationErrors: ["Korisnik sa ovim mejlom vec postoji"],
    });
  }

  const user = await prisma.adminUser.create({
    data: {
      nickName: validationResult.validPayload.nickName,
      email: validationResult.validPayload.email,
      password: await bcrypt.hash(validationResult.validPayload.password, 10),
      role: "editor",
      imgUrl: imgUrl,
      public_id: imgPublicId,
    },
  });
  return redirect("/admin/lekcije/users");
};

export default function newUser() {
  const dataFromJson = useLoaderData<typeof loader>();
  const nickName = dataFromJson.nickName;
  const actionData = useActionData();
  let errorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div className="alert alert-danger" role="alert">
        <ul>
          {actionData?.validationErrors.map((error: string) => (
            <li>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const dropdownToggleRef = useRef<HTMLDivElement | null>(null);
  useInsideOutsideClick(dropdownToggleRef, (isInsideClick) => {
    if (isInsideClick) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  });

  const { previewImgUrl, processImage, handleImgRemoving } =
    useProfileImageHandling(null);

  const [passInputValue, setPassInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassInputValue(newPassword);
  };
  const showIcon = passInputValue !== "";

  return (
    <div className="wrapper">
      {errorsNode}
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
                Novi Editor
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
      <div className="card">
        <div className="card-body">
          <Form
            method="post"
            className="container-lg"
            encType="multipart/form-data"
          >
            <div className="imgContainer d-flex mb-3">
              <img className="editorImg" src={previewImgUrl} />
              <div className="d-flex align-items-center">
                <label id="imageLabel" htmlFor="img">
                  Dodaj sliku
                </label>
                <button
                  style={{ color: "#2c5a53" }}
                  className="btn btn-outline plain-btn"
                  onClick={handleImgRemoving}
                  type="button"
                >
                  <span>/</span>
                  Ukloni sliku
                </button>
                <input
                  id="img"
                  type="file"
                  name="img"
                  accept="image/*"
                  onChange={processImage}
                />
              </div>
            </div>
            <Input
              defaultValue=""
              name="nickName"
              type="text"
              placeholder="Username"
              label="Username"
            />
            <Input
              defaultValue=""
              type="email"
              placeholder="name@example.com"
              name="email"
              label="Imejl"
            />
            <Input
              label="Šifra"
              type="password"
              placeholder="lozinka..."
              name="password"
            />
            {showIcon && (
              <div className="show-pass">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleTogglePassword}
                >
                  <i
                    className={showPassword ? "fa fa-eye" : "fa fa-eye-slash"}
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleGeneratePassword}
                >
                  <i className="fa fa-key" aria-hidden="true"></i>
                </button>
              </div>
            )}
            <div>
              <button className="btn btn-outline-success mt-2" type="submit">
                Sacuvaj
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
