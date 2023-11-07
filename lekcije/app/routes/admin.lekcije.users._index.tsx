import { Link, useLoaderData } from "@remix-run/react";
import { LoaderArgs, json } from "@remix-run/server-runtime";
import { useRef, useState } from "react";
import {
  ensureAuthenticated,
  getAuthenticatedUserId,
} from "~/admin-session.server";

import { prisma } from "~/db.server";
import { useInsideOutsideClick } from "~/utils/useInsideOutsideClick";

export const loader = async function ({ request }: LoaderArgs) {
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
  const users = await prisma.adminUser.findMany({
    where: {
      role: "editor",
    },
  });

  return json({
    users: users,
    nickName: nickName,
  });
};

export default function Users() {
  const dataFromJson = useLoaderData<typeof loader>();
  const editors = dataFromJson.users;
  const nickName = dataFromJson.nickName;
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
                Editori
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
      <div className="main-content-holder">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between">
              <h3>Registrovani editori</h3>
              <button className="btn btn-outline-success floating mt-2">
                <Link to="/admin/lekcije/users/newuser">Novi Editor</Link>
              </button>
            </div>
            <div className="list-group">
              {editors.map(function (editor) {
                return (
                  <Link
                    className="list-group-item list-group-item-action"
                    key={editor.id}
                    to={editor.id.toString()}
                  >
                    <div className="d-flex justify-content-between">
                      {editor.nickName}{" "}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
