import { ActionArgs, LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import {
  ensureAuthenticated,
  getAuthenticatedUserId,
} from "~/admin-session.server";
import { prisma } from "~/db.server";
import { useLoaderData, Form, useActionData, Link } from "@remix-run/react";
import Input from "~/components/Input";
import bcrypt from "bcryptjs";
import { useState } from "react";
import { set } from "zod";

export const loader = async function loader({ request }: LoaderArgs) {
  await ensureAuthenticated(request);
  const userId = await getAuthenticatedUserId(request);
  if (userId === null) {
    throw new Error(`userId must be number, got null`);
  }
  const user = await prisma.adminUser.findUnique({
    where: {
      id: userId,
    },
  });
  if (user === null) {
    throw new Error(`user must be object, got null`);
  }

  return json({ user });
};

export const action = async function ({ request }: ActionArgs) {
  await ensureAuthenticated(request);
  const userId = await getAuthenticatedUserId(request);
  if (userId === null) {
    throw new Error(`userId must be number, got null`);
  }
  const formData = await request.formData();
  const nickName = formData.get("nickName");
  const email = formData.get("email");
  const action = formData.get("_action");

  const validationErrors = [];
  const user = await prisma.adminUser.findUnique({
    where: {
      id: userId,
    },
  });
  if (user === null) {
    validationErrors.push(`user must be object, got null`);
  }

  if (action === "changePassword") {
    const newPassword = formData.get("password");
    const hashedPassword = await bcrypt.hash(newPassword as string, 10);
    await prisma.adminUser.update({
      where: { id: user!.id },
      data: {
        password: hashedPassword,
      },
    });
  }

  if (typeof nickName !== "string") {
    validationErrors.push("nickname must be string, got null");
  }

  if (typeof email !== "string") {
    validationErrors.push("email must be string, got null");
  }

  if (validationErrors.length > 0) {
    return json({
      validationErrors,
    });
  } else {
    await prisma.adminUser.update({
      where: { id: user!.id },
      data: {
        nickName: nickName as string,
        email: email as string,
      },
    });
    return json(null);
  }
};

export default function Profile() {
  const data = useLoaderData<typeof loader>();
  const nickName = data.user.nickName;
  const email = data.user.email;
  const password = data.user.password;

  const actionData = useActionData<typeof action>();
  let errorsNode;
  if (actionData && actionData.validationErrors.length > 0) {
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

  const [showPassword, setShowPassword] = useState(false);
  const [passInputValue, setPassInputValue] = useState("");

  const handleTogglePassword = function () {
    setShowPassword(!showPassword);
  };

  const showIcon = passInputValue !== "";

  return (
    <div className="wrapper">
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item ml-5">
                <Link to="/admin/lekcije">Lekcije</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Cao, {nickName}
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="card form-holder">
        {errorsNode}
        <div className="card-body">
          <Form method="post" className="container-lg">
            <Input
              defaultValue={nickName}
              name="nickName"
              type="text"
              label="Novi username:"
            />
            <Input
              defaultValue={email}
              name="email"
              type="email"
              label="Novi email:"
            />
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-success mt-2" type="submit">
                Sacuvaj
              </button>
            </div>
          </Form>
        </div>
      </div>
      <div className="card form-holder">
        <div className="card-body">
          <Form method="post" className="container-lg password-change">
            <Input
              value={passInputValue}
              name="password"
              type={showPassword ? "text" : "password"}
              label="Novi password:"
              onChange={(value) => {
                setPassInputValue(value);
              }}
            />
            {showIcon && (
              <div className="show-pass profile">
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
              </div>
            )}

            <div className="d-flex justify-content-between">
              <button
                className="btn btn-outline-success mt-2"
                type="submit"
                name="_action"
                value="changePassword"
              >
                Sacuvaj
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
