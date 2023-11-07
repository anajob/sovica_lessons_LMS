import { prisma } from "~/db.server";
import {
  LoaderArgs,
  json,
  ActionArgs,
  redirect,
} from "@remix-run/server-runtime";
import {
  ensureAuthenticated,
  getAuthenticatedUserId,
} from "~/admin-session.server";
import {
  useLoaderData,
  Form,
  Link,
  useActionData,
  useSearchParams,
  useNavigation,
} from "@remix-run/react";
import Input from "~/components/Input";
import Category from "~/components/Category";
import { useEffect, useRef, useState } from "react";
import { useInsideOutsideClick } from "~/utils/useInsideOutsideClick";
import { Button, Modal } from "react-bootstrap";

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
  const url = new URL(request.url);
  let categoryQueryName = url.searchParams.get("category") ?? undefined;
  let categoryDirection = url.searchParams.get("direction") ?? undefined;

  if (
    categoryDirection !== "asc" &&
    categoryDirection !== "desc" &&
    categoryDirection !== undefined
  ) {
    throw new Error("Category direction must be asc or desc");
  }

  if (
    categoryQueryName !== "name" &&
    categoryQueryName !== "createdAt" &&
    categoryQueryName !== undefined
  ) {
    throw new Error("CategoryQueryName must be name or createdAt");
  }

  if (categoryQueryName === undefined) {
    categoryQueryName = "name";
  }
  if (categoryDirection === undefined) {
    categoryDirection = "desc";
  }
  const categories = await prisma.category.findMany({
    orderBy: [
      {
        [categoryQueryName]: categoryDirection,
      },
    ],
  });

  return json({
    categories: categories,
    nickName: nickName,
  });
};

export const action = async function ({ request, params }: ActionArgs) {
  await ensureAuthenticated(request);

  const formData = await request.formData();

  const action = formData.get("_action");

  if (action === "CREATE") {
    const categoryName = formData.get("categoryName");
    if (typeof categoryName !== "string") {
      throw new Error("category must be string, got null");
    }
    await prisma.category.create({
      data: {
        name: categoryName,
      },
    });
  }

  if (action === "UPDATE") {
    const categoryName = formData.get("categoryName");
    if (typeof categoryName !== "string") {
      throw new Error("category must be string, got null");
    }
    const categoryIdString = formData.get("categoryId");
    if (typeof categoryIdString !== "string") {
      throw new Error("categoryIdString must be string, got null");
    }
    const categoryId = parseInt(categoryIdString);
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: categoryName,
      },
    });
  }

  if (action === "DELETE") {
    const categoryIdString = formData.get("categoryId");
    if (typeof categoryIdString !== "string") {
      throw new Error("categoryIdString must be string, got null");
    }
    const categoryId = parseInt(categoryIdString);

    await prisma.lekcija.updateMany({
      data: {
        categoryId: null,
      },
      where: {
        categoryId: categoryId,
      },
    });
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });
  }

  return null;
};

export default function Categories() {
  const dataFromJson = useLoaderData<typeof loader>();
  const categories = dataFromJson.categories;
  const nickName = dataFromJson.nickName;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();

  const isCreating = navigation.formData?.get("_action") === "CREATE";
  let addCategoryFormRef = useRef<HTMLFormElement>(null);

  let removeCategoryFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isCreating) {
      addCategoryFormRef.current?.reset();
    }
  }, [isCreating]);

  const sortOption = [
    {
      label: "od najstrijeg",
      categoryDirection: "asc",
      categoryQueryName: "createdAt",
    },
    {
      label: "od najnovijeg",
      categoryDirection: "desc",
      categoryQueryName: "createdAt",
    },
    {
      label: "nasov ABC opadajuce",
      categoryDirection: "desc",
      categoryQueryName: "name",
    },
    {
      label: "naslov ABC rastuce",
      categoryDirection: "asc",
      categoryQueryName: "name",
    },
  ];
  function handleSortOption(valueFromSelect: string) {
    setSearchParams({
      category: sortOption[parseInt(valueFromSelect)].categoryQueryName,
      direction: sortOption[parseInt(valueFromSelect)].categoryDirection,
    });
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

  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="wrapper categories">
      <div className="card">
        <div className="card-body d-flex justify-content-between align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item ml-5">
                <Link to="/admin/lekcije">Lekcije</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Sve kategorije
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

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between mb-4">
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ width: "40%" }}
            >
              <h3>Unete kategorije</h3>

              <button
                className="btn btn-outline disabled: "
                style={{ color: "#10bca2" }}
                onClick={openModal}
                disabled={showModal}
              >
                Dodaj novu oblast
              </button>
              <Modal centered show={showModal} onHide={closeModal}>
                <Modal.Header closeButton>
                  <Modal.Title>Dodaj novu kategoriju</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form
                    ref={addCategoryFormRef}
                    method="post"
                    className="container-lg d-flex"
                    id="addCategoryForm"
                  >
                    <Input
                      name="categoryName"
                      type="text"
                      defaultValue=""
                      label=""
                      placeholder="Unesite ime kategorije..."
                    />
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeModal}>
                    Odustani
                  </Button>

                  <Button
                    type="submit"
                    value="CREATE"
                    variant="outline"
                    className="btn mt-2"
                    name="_action"
                    form="addCategoryForm"
                    onClick={closeModal}
                  >
                    Dodaj
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
            <select
              className="form-select form-select-sm filter"
              onChange={(e) => handleSortOption(e.target.value)}
            >
              <option value="">Sortiraj prema</option>
              {sortOption.map(function (option, index) {
                return (
                  <option key={index} value={index}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="list-group">
            {categories.map(function (category) {
              return <Category key={category.id} category={category} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
