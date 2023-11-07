import { Form, useActionData } from "@remix-run/react";
import { ActionArgs, json } from "@remix-run/server-runtime";
import { prisma } from "~/db.server";
import { validateEmail } from "~/utils/emailValidation";
import crypto from "crypto";

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
  const validationResult = validateEmail(email);
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
      return json({
        validationErrors: ["Ne postoji korisnik sa tom mejl adresom"],
      });
    } else {
      function generateUniqueToken() {
        return crypto.randomBytes(20).toString("hex");
      }
      const token = generateUniqueToken();
      await prisma.adminUser.update({
        where: {
          id: user.id,
        },
        data: {
          token: token,
        },
      });

      const resetLink = `http://localhost:3000/admin/forgot-password/${token}`;
      await sendMail(resetLink, validationResult.validPayload.email);
      return json({
        message: "Imejl za resetovanje sifre je poslat na vasu mejl adresu",
      });
    }
  }
};

export default function resetPassword() {
  const actionData = useActionData();
  let errorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div className="alert alert-danger" role="alert">
        <ul>
          {actionData?.validationErrors.map((error: any) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
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
                <div>
                  <button className="btn btn-primary mt-2" type="submit">
                    Posalji
                  </button>
                </div>
              </Form>
              {actionData && actionData.message && (
                <div className="alert alert-primary" role="alert">
                  {actionData.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
