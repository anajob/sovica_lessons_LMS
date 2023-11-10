import { json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";

import { countLekcije, getLekcije } from "~/models/lekcija.server";
import { ensureAuthenticated } from "~/admin-session.server";
import { getAuthenticatedUserId } from "~/admin-session.server";
import { prisma } from "~/db.server";
import { useState } from "react";
import { array, number, set } from "zod";

// import { Vocative } from "vokativ-js";

export const loader = async function ({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") ?? "";
  const categoryQueryString = url.searchParams.get("categoryId") ?? "";
  let sortByQueryDirection = url.searchParams.get("direction") ?? undefined;
  let sortByColumn = url.searchParams.get("criteria") ?? undefined;

  if (
    sortByQueryDirection !== "asc" &&
    sortByQueryDirection !== "desc" &&
    sortByQueryDirection !== undefined
  ) {
    throw new Error("Sort order must be asc or desc");
  }

  if (
    sortByColumn !== "title" &&
    sortByColumn !== "createdAt" &&
    sortByColumn !== undefined
  ) {
    throw new Error("Sort columns must be title or createdAt");
  }

  let categoryIdQuery;
  if (categoryQueryString !== "") {
    categoryIdQuery = parseInt(categoryQueryString);
  }

  const pageNumberString = url.searchParams.get("page") ?? "0";
  const pageNumber = parseInt(pageNumberString);
  if (isNaN(pageNumber)) {
    throw new Error("invalid page number");
  }

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
  const userRole = user.role;
  // let v = new Vocative();
  // let name = await v.make(nickName);
  const lessons = await getLekcije(
    searchQuery,
    categoryIdQuery,
    pageNumber,
    sortByQueryDirection,
    sortByColumn
  );
  const categories = await prisma.category.findMany();
  const totalLessons = await countLekcije(searchQuery, categoryIdQuery);
  return json({
    lekcije: lessons,
    nickName: nickName,
    userRole: userRole,
    categories: categories,
    totalLessons: totalLessons,
    pageNumber: pageNumber,
  });
};

export default function Lekcije() {
  const dataFromJson = useLoaderData<typeof loader>();
  const lekcije = dataFromJson.lekcije;
  const nickName = dataFromJson.nickName;
  const userRole = dataFromJson.userRole;
  const categories = dataFromJson.categories;
  const currentPage = dataFromJson.pageNumber;
  const [searchParams, setSearchParams] = useSearchParams();
  let searchText = searchParams.get("search") ?? "";
  let searchCategoryId = searchParams.get("categoryId") ?? "";
  const totalLessons = dataFromJson.totalLessons;
  const lessonsPerPage = 3;
  const totalPages = Math.floor(totalLessons / lessonsPerPage);
  const pageNummbers: number[] = [];
  const adminRoleAdditionalClass = userRole === "admin" ? "vertical-align" : "";
  for (let i = 0; i <= totalPages; i++) {
    pageNummbers.push(i);
  }

  const sortOption = [
    {
      label: "od najstrijeg",
      sortByQueryDirection: "asc",
      sortByColumn: "createdAt",
    },
    {
      label: "od najnovijeg",
      sortByQueryDirection: "desc",
      sortByColumn: "createdAt",
    },
    {
      label: "nasov ABC opadajuce",
      sortByQueryDirection: "desc",
      sortByColumn: "title",
    },
    {
      label: "naslov ABC rastuce",
      sortByQueryDirection: "asc",
      sortByColumn: "title",
    },
  ];

  const handleSortSelect = function (valueFromSelect: string) {
    setSearchParams({
      direction: sortOption[parseInt(valueFromSelect)].sortByQueryDirection,
      column: sortOption[parseInt(valueFromSelect)].sortByColumn,
      categoryId: searchCategoryId,
      search: searchText,
    });
  };

  return (
    <main>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3 side-nav">
            <Link className="logo" to="/admin/lekcije">
              <div className="logo-wrapper">
                <img className="logo-icon" src="/logo.svg" />
                <p className="logo-title">Lekcije kod Sovice</p>
              </div>
            </Link>
            <ul className={`nav ${adminRoleAdditionalClass}`}>
              <li className="nav-item">
                <Link
                  to="new"
                  className="btn btn-outline-success
                "
                >
                  Nova Lekcija
                </Link>
              </li>
              <li className="nav-item">
                <Link to="categories" className="btn btn-outline-success">
                  Upravljaj Oblastima
                </Link>
              </li>
              {userRole === "admin" && (
                <li className="nav-item">
                  <Link to="users" className="btn btn-outline-success">
                    Upravljaj Editorima
                  </Link>
                </li>
              )}
            </ul>
            <div className="media d-flex align-items-center">
              <Link className="user-link" to="/admin/profile">
                <div className="media-left">
                  <img
                    className="img-fluid media-object rounded-circle"
                    src="/avatar.jpg"
                    alt="Avatar"
                    style={{ width: "80" + "px", height: "80" + "px" }}
                  />
                </div>
                <div className="media-body">
                  <div className="navbar-brand">{nickName}</div>
                </div>
              </Link>
            </div>

            <form className="logout" action="/admin/logout" method="post">
              <button type="submit" className="btn btn-outline-success my-5">
                Odjavi se
              </button>
            </form>
          </div>
          <div className="col-md-9 main-holder-col">
            <div className="top-bar card">
              <div className="card-body d-flex justify-content-between">
                <div className="media-body">
                  <a
                    className="navbar-brand"
                    href="#"
                    data-testid="userGreeting"
                  >
                    Cao, {nickName}!
                  </a>
                </div>
                <div className="search">
                  <div className="input-group mb-3">
                    <span className="input-group-text" id="basic-addon1">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      name="search"
                      type="text"
                      className="form-control"
                      placeholder="Pretraži lekcije..."
                      defaultValue={searchText}
                      onChange={(e) =>
                        setSearchParams({
                          search: e.target.value,
                          categoryId: searchCategoryId,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="main-content-holder">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h3>Unete lekcije</h3>
                    <div className="d-flex filters-holder justify-content-between">
                      <select
                        className="form-select form-select-sm filter"
                        onChange={(e) => {
                          handleSortSelect(e.target.value);
                        }}
                      >
                        <option value="">Sortiraj lekcije</option>
                        {sortOption.map(function (option, index) {
                          return (
                            <option key={index} value={index}>
                              {option.label}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        className="form-select form-select-sm filter"
                        value={searchCategoryId}
                        onChange={(e) =>
                          setSearchParams({
                            categoryId: e.target.value,
                            search: searchText,
                          })
                        }
                      >
                        <option value="">Izaberi oblast</option>
                        {categories.map(function (category) {
                          return (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="list-group">
                    {lekcije.map(function (lekcija) {
                      const category = categories.find(function (category) {
                        return category.id === lekcija.categoryId;
                      });
                      return (
                        <Link
                          className="list-group-item list-group-item-action"
                          key={lekcija.id}
                          to={lekcija.id.toString()}
                        >
                          <div className="d-flex justify-content-between">
                            {lekcija.title}{" "}
                            <div>
                              {category === undefined
                                ? "bez kategorije"
                                : category?.name}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {lekcije.length === 0 && (
                      <div>
                        <h4>No Results Found</h4>
                        <h6>
                          We're sorry, but there are no lessons matching your
                          search criteria. Please try again with a different
                          keyword.
                        </h6>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="pagination-holder">
              <ul className="pagination">
                {pageNummbers.map(function (pageNumber) {
                  return (
                    <li
                      className={`page-item ${
                        pageNumber === currentPage ? "active" : ""
                      }`}
                      key={pageNumber}
                    >
                      <Link
                        className={`page-link ${
                          pageNumber === currentPage ? "active" : ""
                        }`}
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setSearchParams({
                            search: searchText,
                            categoryId: searchCategoryId,
                            page: pageNumber.toString(),
                          });
                        }}
                      >
                        {pageNumber + 1}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <h6>Ukupno lekcija: {totalLessons}</h6>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
