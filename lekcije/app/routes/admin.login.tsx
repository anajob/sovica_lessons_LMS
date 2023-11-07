import { authenticateAdminUser } from "~/admin-session.server";
import { Form, Link } from "@remix-run/react";
import { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "react-router";
import { prisma } from "~/db.server";
import bcrypt from "bcryptjs";
import { useState } from "react";
import { generateRandomPassword } from "~/utils/generateRandomPassword";

export const action = async function ({ request, params }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string") {
    throw new Error(`email must be string, got null`);
  }
  if (typeof password !== "string") {
    throw new Error(`password must be a string`);
  }

  const user = await prisma.adminUser.findFirst({
    where: {
      email,
    },
  });
  if (user === null) {
    throw new Error(`user with this email doesn't exist`);
  }

  if (await bcrypt.compare(password, user.password)) {
    return await authenticateAdminUser(request, user);
  } else {
    return redirect("/admin/login");
  }
};

export default function AdminLogin() {
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
                <button className="btn btn-primary mt-2" type="submit">
                  Uloguj se
                </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
