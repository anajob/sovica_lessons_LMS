import { Form, useActionData } from "@remix-run/react";
import { ActionArgs } from "@remix-run/server-runtime";
import { useState } from "react";
import { redirect } from "react-router-dom";
import { prisma } from "~/db.server";
import { generateRandomPassword } from "~/utils/generateRandomPassword";
import bcrypt from "bcryptjs";
import { adminUser } from "@prisma/client";
import { set } from "zod";
import { json } from "@remix-run/node";

export const action = async function ({ request, params }: ActionArgs) {
  const user: adminUser | null = await prisma.adminUser.findFirst({
    where: {
      token: params.token,
    },
  });

  const validationErrors = [];

  if (user === null) {
    validationErrors.push(`Korisnik sa ovim mejlom ne postoji`);
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const passwordConfirm = formData.get("passwordConfirm");
  if (password !== passwordConfirm) {
    validationErrors.push(`Lozinke se ne poklapaju`);
  }

  if (validationErrors.length > 0) {
    return json({
      validationErrors,
    });
  } else {
    const newPassword = formData.get("password");
    const hashedPassword = await bcrypt.hash(newPassword as string, 10);
    await prisma.adminUser.update({
      where: { id: user!.id },
      data: {
        password: hashedPassword,
      },
    });
    return redirect("/admin/login");
  }
};

export default function PasswordForgot() {
  const actionData = useActionData<typeof action>();
  const [passInputValue, setPassInputValue] = useState("");
  const [confirmPassInputValue, setconfirmPassInputValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTogglePasswordVisibility = (
    currentVisibility: boolean,
    setVisibility: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setVisibility(!currentVisibility);
  };

  function showIcon(inputValue: string): boolean {
    return inputValue !== "";
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassInputValue(newPassword);
  };

  let errorsNode;
  if (actionData && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div className="alert alert-danger" role="alert">
        <ul>
          {actionData.validationErrors.map((error: any) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="wrapper">
      {errorsNode}
      <div className="centered-form">
        <div
          className="d-flex flex-container justify-content-center"
          style={{ width: "100%" }}
        >
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
              <h4 className="card-title">Promena lozinke!</h4>
              <p className="card-text">Unesite novu lozinku .</p>
              <Form method="post" className="container-lg">
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
                    <label htmlFor="floatingInput">Nova Lozinka:</label>
                    {showIcon(passInputValue) && (
                      <div className="show-pass">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            handleTogglePasswordVisibility(
                              showPassword,
                              setShowPassword
                            )
                          }
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
                  <div className="form-floating mb-3">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      id="floatingInputConfirm"
                      placeholder="name@example.com"
                      required
                      name="passwordConfirm"
                      value={confirmPassInputValue}
                      onChange={(e) => {
                        setconfirmPassInputValue(e.target.value);
                      }}
                    />
                    <label htmlFor="floatingInputConfirm">
                      Potvrdi Lozinku:
                    </label>
                    {showIcon(confirmPassInputValue) && (
                      <div className="show-pass">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() =>
                            handleTogglePasswordVisibility(
                              showConfirmPassword,
                              setShowConfirmPassword
                            )
                          }
                        >
                          <i
                            className={
                              showPassword ? "fa fa-eye" : "fa fa-eye-slash"
                            }
                            aria-hidden="true"
                          ></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-grid mx-auto gap-2">
                  <button className="btn btn-primary mt-2" type="submit">
                    Sacuvaj
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
