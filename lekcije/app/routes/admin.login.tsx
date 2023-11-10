import { authenticateAdminUser } from "~/admin-session.server";
import { Form, Link, useActionData } from "@remix-run/react";
import { ActionArgs, json } from "@remix-run/server-runtime";
import { redirect } from "react-router";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import { useState } from "react";
import { generateRandomPassword } from "~/utils/generateRandomPassword";
import { validateUserLoginPayload } from "~/utils/validateUserLogin";

export const action = async function ({ request, params }: ActionArgs) {
  const formData = await request.formData();
  const validationResult = validateUserLoginPayload(formData);
  let validationErrors = [];

  if (!validationResult.isValid) {
    return json({
      validationErrors: validationResult.validationErrors,
    });
  } else {
    const user = await prisma.adminUser.findFirst({
      where: {
        email: validationResult.validPayload.email,
      },
    });

    if (user === null) {
      validationErrors.push("Korisnik sa ovim mejlom ne postoji");
    } else {
      if (
        await bcrypt.compare(
          validationResult.validPayload.password,
          user.password
        )
      ) {
        return await authenticateAdminUser(request, user);
      } else {
        validationErrors.push("Pogrešna lozinka");
      }
    }
    return json({
      validationErrors: validationErrors,
    });
  }
};

export default function AdminLogin() {
  const actionData = useActionData();
  const [passInputValue, setPassInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  console.log("actionData", actionData);
  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassInputValue(newPassword);
  };

  const showIcon = passInputValue !== "";
  let payloadErrorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    payloadErrorsNode = (
      <div className="alert alert-danger auth-alert" role="alert">
        <ul>
          {actionData?.validationErrors.map((error: string) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
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
              Sovica vas pozdravlja! Ulogujte se kako biste započeli avanturu na
              administrativnom panelu za učenje srpskog jezika. Evo kako da se
              ulogujete:
            </p>
            <Form method="post" className="container-lg">
              <div className="mb-3">
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="usernameInput"
                    placeholder="name@example.com"
                    required
                    name="email"
                    data-testid="emailInput"
                  />
                  <label htmlFor="usernameInput">Imejl adresa:</label>
                </div>
              </div>
              <div className="mb-3">
                <div className="form-floating mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    id="passwordInput"
                    placeholder="name@example.com"
                    required
                    name="password"
                    value={passInputValue}
                    onChange={(e) => {
                      setPassInputValue(e.target.value);
                    }}
                    data-testid="passwordInput"
                  />
                  <label htmlFor="passwordInput">Lozinka:</label>
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
                  <button
                    className="btn btn-primary mt-2"
                    type="submit"
                    data-testid="loginButton"
                  >
                    Uloguj se
                  </button>
                </div>
              </div>
            </Form>
            <div className="info-links">
              <p>
                Zaboravili ste lozinku? Kliknite{" "}
                <Link to="/admin/reset-password">OVDE</Link> kako biste je
                resetovali.
              </p>
              <p>
                Nemate nalog? Kliknite <Link to="/admin/signup">OVDE</Link> kako
                biste ga napravili.
              </p>
              <p>
                Hvala vam što koristite Lekcije kod Sovice i doprinosite učenju
                srpskog jezika!
              </p>
            </div>
            {payloadErrorsNode}
          </div>
        </div>
      </div>
    </div>
  );
}
