import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { ensureAuthenticated } from "~/admin-session.server";
import { prisma } from "~/db.server";
import { getAuthenticatedUserId } from "~/admin-session.server";
import { Suspense, useRef, useState } from "react";
import { createLekcija } from "~/models/lekcija.server";
import { useInsideOutsideClick } from "~/utils/useInsideOutsideClick";
import Input from "~/components/Input";
import LazyEditor from "~/components/LazyEditor";

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
  const nickName = user.nickName;

  const categories = await prisma.category.findMany();
  return json({ nickName, categories });
};

export const action = async function ({ request }: ActionArgs) {
  await ensureAuthenticated(request);

  const formData = await request.formData();

  const title = formData.get("title");
  const videoLink = formData.get("videoLink");
  const content = formData.get("content");
  const categoryIdString = formData.get("categoryIdFromSelect");
  let categoryId;
  if (categoryIdString !== null) {
    if (categoryIdString === "") {
      categoryId = null;
    } else {
      categoryId = parseInt(categoryIdString as string);
    }
  }

  const validationErrors = [];

  if (typeof title !== "string") {
    validationErrors.push("title must be a string");
  }

  const titleInDatabase = await prisma.lekcija.findFirst({
    where: { title: title as string },
  });

  if (titleInDatabase !== null) {
    validationErrors.push("Title with this name already exist");
  }

  if (typeof videoLink !== "string") {
    validationErrors.push("videoLink must be a string");
  }

  if (typeof content !== "string") {
    validationErrors.push("content must be a string");
  }

  if (validationErrors.length > 0) {
    return json({
      validationErrors,
    });
  } else {
    await createLekcija({
      title: title as string,
      videoLink: videoLink as string,
      content: content as string,
      categoryId: categoryId as number | null,
    });
    return redirect("/admin/lekcije");
  }
};

export default function Lekcija() {
  const { nickName, categories } = useLoaderData<typeof loader>();

  const actionData: undefined | { validationErrors: string[] } =
    useActionData<typeof action>();

  let errorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div
        className="alert alert-danger auth-alert"
        style={{ marginTop: "10px" }}
        role="alert"
      >
        <ul>
          {actionData?.validationErrors.map((error) => (
            <li key={error}>{error}</li>
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

  return (
    <div className="wrapper">
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item  ml-5">
                <Link to="/admin/lekcije">Lekcije</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Nova Lekcija
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
          <Form method="post" className="container-lg">
            <select
              name="categoryIdFromSelect"
              className="form-select form-select-sm float-end mb-3 me-0 filter"
              aria-label="Default select example"
            >
              <option value="">Odaberi kategoriju</option>
              {categories.map(function (category) {
                return (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                );
              })}
            </select>
            <Input
              defaultValue=""
              name="title"
              type="text"
              label="Lekcija Title:"
            />
            <Input
              defaultValue=""
              type="url"
              name="videoLink"
              label="Video Link:"
            />
            <div className="lazy-editor-holder mb-3">
              <LazyEditor defaultValue="" name="content" />
            </div>
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-success mt-2" type="submit">
                Sacuvaj
              </button>
            </div>
            {errorsNode}
          </Form>
        </div>
      </div>
    </div>
  );
}
