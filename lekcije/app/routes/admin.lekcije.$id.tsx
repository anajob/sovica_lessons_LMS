import { ensureAuthenticated } from "~/admin-session.server";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { LoaderArgs, ActionArgs, redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { deleteLekcija, getLekcija } from "~/models/lekcija.server";
import { updateLekcija } from "~/models/lekcija.server";
import { Button, Modal } from "react-bootstrap";
import { useRef, useState } from "react";
import { prisma } from "~/db.server";
import { getAuthenticatedUserId } from "~/admin-session.server";
import { useInsideOutsideClick } from "~/utils/useInsideOutsideClick";
import Input from "~/components/Input";
import LazyEditor from "~/components/LazyEditor";

type ValidResult = {
  isValid: true;
  validPayload: {
    title: string;
    videoLink: string;
    content: string;
    categoryId: number | null;
  };
};

type InvalidResult = {
  isValid: false;
  validationErrors: string[];
};

type ValidationResult = ValidResult | InvalidResult;

function validateLessonUpdatePayload(formData: FormData): ValidationResult {
  const validationErrors = [];
  const title = formData.get("title");
  const videoLink = formData.get("videoLink");
  const content = formData.get("content");
  const categoryIdString = formData.get("categoryIdFromSelect");
  let categoryId = null;

  if (typeof title !== "string") {
    validationErrors.push("title must be a string");
  }

  if (typeof videoLink !== "string") {
    validationErrors.push("videoLink must be a string");
  }

  if (typeof content !== "string") {
    validationErrors.push("content must be a string");
  }

  if (typeof categoryIdString !== "string") {
    validationErrors.push("categoryIdString must be string");
  }

  if (categoryIdString !== "") {
    categoryId = parseInt(categoryIdString as string);
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
        title: title as string,
        videoLink: videoLink as string,
        content: content as string,
        categoryId: categoryId,
      },
    };
  }
}

export const loader = async function ({ request, params }: LoaderArgs) {
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

  if (typeof params.id !== "string") {
    throw new Error("type of id is not string");
  }
  const lekcija = await getLekcija(parseFloat(params.id));
  if (lekcija === null) {
    throw new Error(`lekcija with ${params.id} does not exist`);
  }
  const categories = await prisma.category.findMany();
  return json({
    lekcija,
    nickName,
    categories,
  });
};

export const action = async function ({ request, params }: ActionArgs) {
  await ensureAuthenticated(request);
  const formData = await request.formData();
  const id = params.id;
  const action = formData.get("_action");

  if (action === "DELETE") {
    await deleteLekcija(parseInt(id as string));
    return redirect("/admin/lekcije");
  } else {
    if (typeof id !== "string") {
      throw new Error("id must be a string");
    }

    const validationResult = validateLessonUpdatePayload(formData);
    if (!validationResult.isValid) {
      return json({
        validationErrors: validationResult.validationErrors,
      });
    }

    await updateLekcija({
      id: parseInt(id as string),
      payload: {
        title: validationResult.validPayload.title,
        videoLink: validationResult.validPayload.videoLink,
        content: validationResult.validPayload.content,
        categoryId: validationResult.validPayload.categoryId,
      },
    });
    return redirect("/admin/lekcije");
  }
};

export default function Lekcija() {
  const { lekcija, nickName, categories } = useLoaderData<typeof loader>();
  const actionData: undefined | { validationErrors: string[] } =
    useActionData<typeof action>();
  let errorsNode;
  if (actionData?.validationErrors && actionData.validationErrors.length > 0) {
    errorsNode = (
      <div className="alert alert-danger auth-alert" role="alert">
        <ul>
          {actionData?.validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

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
      {errorsNode}
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item ml-5">
                <Link to="/admin/lekcije">Lekcije</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {lekcija.title}
              </li>
            </ol>
          </nav>
          <div className="dropdown">
            <div
              className="dropdown-toggle d-flex align-items-center justify-content-center"
              ref={dropdownToggleRef}
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
          <Form method="post" className="container-lg">
            <select
              name="categoryIdFromSelect"
              className="form-select float-end form-select-sm mb-3 me-0 filter"
              aria-label="Default select example"
              defaultValue={lekcija.categoryId ?? undefined}
            >
              <option value="">Odaberi oblast</option>
              {categories.map(function (category) {
                return (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                );
              })}
            </select>
            <Input
              name="title"
              type="text"
              defaultValue={lekcija.title}
              label="Lekcija Title:"
            />
            <Input
              type="url"
              name="videoLink"
              defaultValue={lekcija.videoLink}
              label="Video Link:"
            />
            <div className="lazy-editor-holder mb-3">
              <LazyEditor defaultValue={lekcija.content} name="content" />
            </div>
            <div className="d-flex justify-content-between">
              <button className="btn btn-outline-success mt-2" type="submit">
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
              Da li ste sigurni da želite da obrišete lekciju?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>
                Odustani
              </Button>
              <form method="post">
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
