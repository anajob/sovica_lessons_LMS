import { Form, Link, useActionData } from "@remix-run/react";
import { ActionArgs, json } from "@remix-run/server-runtime";
import { authenticateAdminUser } from "~/admin-session.server";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import { validateUserCreatePayload } from "~/utils/validateUser";
import { generateRandomPassword } from "~/utils/generateRandomPassword";
import { useState } from "react";

export const action = async function ({ request }: ActionArgs) {
  const formData = await request.formData();
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

  const user = await prisma.adminUser.create({
    data: {
      nickName: validationResult.validPayload.nickName,
      email: validationResult.validPayload.email,
      password: await bcrypt.hash(validationResult.validPayload.password, 10),
      role: "admin",
      imgUrl: null,
    },
  });
  const redirectResponse = await authenticateAdminUser(request, user);
  return redirectResponse;
};

export default function AdminLogin() {
  const actionData: undefined | { validationErrors: string[] } =
    useActionData<typeof action>();

  let errorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div className="alert alert-danger" role="alert">
        <ul>
          {actionData?.validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
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
      <div className="centered-form">
        <div className="d-flex flex-container justify-content-center">
          <div
            className="card welcome-card mb-3 text-center"
            style={{ width: "50%" }}
          >
            <div className="card-body"></div>
          </div>

          <div
            className="card login-card mb-3 text-center"
            style={{ width: "50%" }}
          >
            <img
              className="img-fluid media-object rounded-circle logo-avatar"
              src="/avatar.png"
              alt="Avatar"
              style={{ width: "50" + "px", height: "50" + "px" }}
            />
            <div className="card-body">
              <h4 className="card-title">Dobrodošli u Lekcije kod Sovice!</h4>
              <p className="card-text">
                Da biste se registrovali na našu platformu za učenje srpskog
                jezika, molimo vas da popunite sledeće informacije:
              </p>
              <Form method="post" className="container-lg">
                <div className="mb-3">
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="floatingInput"
                      placeholder="nickname"
                      required
                      name="nickName"
                    />
                    <label htmlFor="floatingInput">Username:</label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="floatingInput"
                      placeholder="name@example.com"
                      required
                      name="email"
                    />
                    <label htmlFor="floatingInput">Imejl adresa:</label>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="form-floating mb-3">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="floatingInput"
                      placeholder="name@example.com"
                      required
                      name="password"
                      value={passInputValue}
                      onChange={(e) => {
                        setPassInputValue(e.target.value);
                      }}
                    />
                    <label htmlFor="floatingInput">Lozinka:</label>
                    {showIcon && (
                      <div className="show-pass">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleTogglePassword}
                        >
                          <i
                            className={
                              showPassword ? "fa fa-eye" : "fa fa-eye-slash"
                            }
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
                  </div>
                </div>

                <div>
                  <div className="d-grid mx-auto gap-2">
                    <button className="btn btn-primary mt-2" type="submit">
                      Registruj se
                    </button>
                  </div>
                </div>
              </Form>
              <div className="info-links">
                <p>
                  Već imate nalog? Kliknite <Link to="/admin/login">OVDE </Link>
                  da se prijavite.
                </p>
                <p>Hvala vam što se pridružujete Lekcijama kod Sovice!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
