import { Form, useActionData } from "@remix-run/react";
import { ActionArgs, json, redirect } from "@remix-run/server-runtime";
import { prisma } from "~/db.server";
import crypto from "crypto";
import { useState } from "react";
import { useNavigation } from "@remix-run/react";

const apiKey = process.env.RESET_PASSWORD_API_KEY;
const resetEmail = process.env.RESET_PASSWORD_EMAIL;

if (typeof apiKey === undefined) {
  throw new Error("apiKey must be set");
}

if (typeof apiKey === null) {
  throw new Error("apiKey must be set");
}
if (apiKey === "") {
  throw new Error("apiKey must be set");
}

if (typeof resetEmail === undefined) {
  throw new Error("resetEmail must be set");
}

async function sendMail(resetLink: string, email: string) {
  fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey || "",
    },
    body: JSON.stringify({
      sender: {
        name: "Lekcije kod Sovice",
        email: resetEmail,
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "My subject",
      htmlContent: `
        <html>
            <head></head>
            <body>
                <p>
                    Click <a href="${resetLink}">here</a> 
                    to reset your password
                </p>
            </body>
        </html>`,
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error:", error));
}

export const action = async function ({ request }: ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const errorValidation: (string | string[])[] = [];

  if (email === null) {
    errorValidation.push("Email nije unet");
  }

  if (typeof email !== "string") {
    errorValidation.push("Email nije validan");
  }

  if (email !== null && email.length < 6) {
    errorValidation.push("Email mora sadrzati minimum sest karaktera");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email as string);
  if (!isValid) {
    errorValidation.push("Email nije validan");
  }

  function generateUniqueToken() {
    return crypto.randomBytes(20).toString("hex");
  }
  const token = generateUniqueToken();

  const user = await prisma.adminUser.findFirst({
    where: {
      email: email as string,
    },
  });
  if (user === null) {
    errorValidation.push("Ne postoji korisnik sa tom mejl adresom");
  } else {
    await prisma.adminUser.update({
      where: {
        id: user?.id,
      },
      data: {
        token: token,
      },
    });
  }

  const resetLink = `http://localhost:3000/admin/forgot-password/${token}`;

  if (errorValidation.length > 0) {
    return json({
      errorValidation,
    });
  } else {
    await sendMail(resetLink, email as string);
    return json({
      message: "Imejl za resetovanje sifre je poslat na vasu imejl adresu",
    });
  }
};

export default function resetPassword() {
  const actionData = useActionData();
  const navigation = useNavigation();
  let errorsNode;
  if (actionData?.errorValidation && actionData.errorValidation.length > 0) {
    errorsNode = (
      <div
        className="alert alert-danger auth-alert"
        style={{ marginTop: "100px" }}
        role="alert"
      >
        <ul>
          {actionData?.errorValidation.map((error: any) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  return (
    <div className="wrapper">
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
              <p className="card-text">
                Unesite mejl na koji ce vam stici link za promenu lozinke.
              </p>
              <Form
                onSubmit={handleSubmit}
                method="post"
                className="container-lg"
              >
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
                <div>
                  <div className="d-grid mx-auto gap-2">
                    <button
                      className="btn btn-primary mt-2"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Poslato" : "Posalji"}
                    </button>
                  </div>
                </div>
              </Form>
              {actionData && actionData.message && (
                <div
                  className="alert alert-primary"
                  style={{ marginTop: "100px" }}
                  role="alert"
                >
                  {actionData.message}
                </div>
              )}
              {errorsNode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
