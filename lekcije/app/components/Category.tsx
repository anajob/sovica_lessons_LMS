import Input from "~/components/Input";
import { Button, Modal } from "react-bootstrap";
import { Form, useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

type Category = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function Category({ category }: { category: Category }) {
  const [show, setShow] = useState(false);
  const handleCloseDeleteModal = () => setShow(false);
  const handleShowDeleteModal = () => setShow(true);

  const [showInput, setShowInput] = useState(false);
  const handleShowInput = function () {
    setShowInput(true);
  };
  const handleHideInput = function () {
    setShowInput(false);
  };

  return (
    <div className="list-group-item list-group-item-action" key={category.id}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <Form
            className="d-flex align-items-center"
            method="post"
            onSubmit={handleHideInput}
          >
            {!showInput && (
              <div className="d-flex align-items-center">
                <div>{category.name}</div>
                <button
                  className="btn btn-outline-primary btn-sm changing-btn ms-5"
                  onClick={handleShowInput}
                >
                  Izmeni
                </button>
              </div>
            )}
            {showInput && (
              <div className="d-flex align-items-center justify-content-center">
                <Input
                  name="categoryName"
                  type="text"
                  defaultValue={category.name}
                  label=""
                />
                <input name="categoryId" type="hidden" value={category.id} />
                <div
                  className="btn-group-sm ms-5 mt-2"
                  role="group"
                  aria-label="Basic example"
                >
                  <button
                    className="btn btn-outline-primary changing-btn me-2"
                    value="UPDATE"
                    name="_action"
                    type="submit"
                  >
                    sacuvaj
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary
                    changing-btn"
                    onClick={handleHideInput}
                  >
                    odustani
                  </button>
                </div>
              </div>
            )}
          </Form>
        </div>
        <div>
          <button
            className="btn changing-btn btn-outline-primary btn-sm mt-2"
            onClick={handleShowDeleteModal}
          >
            Ukloni
          </button>
          <Modal
            show={show}
            onHide={handleCloseDeleteModal}
            animation={false}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Brisanje oblasti</Modal.Title>
            </Modal.Header>
            <Form
              method="post"
              id={"removeCategory" + category.id}
              onSubmit={handleCloseDeleteModal}
            >
              <Modal.Body>
                Da li ste sigurni da zelite da uklonite ovu oblast:{" "}
                {category.name}?
                <input name="categoryId" type="hidden" value={category.id} />
              </Modal.Body>
            </Form>

            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseDeleteModal}>
                Odustani
              </Button>
              <Button
                variant="primary"
                value="DELETE"
                name="_action"
                type="submit"
                form={"removeCategory" + category.id}
              >
                Ukloni
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}
