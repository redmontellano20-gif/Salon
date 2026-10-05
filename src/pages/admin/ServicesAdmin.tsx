import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  admin,
  ApiError,
} from "../../api/client";

import type {
  ServiceGroup,
  ServiceItem,
} from "../../api/types";

import {
  Button,
  Card,
  Loading,
  PageHeader,
  inputClass,
  labelClass,
} from "./ui";

/* =========================================
   TYPES
========================================= */

type Message = {
  kind: "ok" | "error";
  text: string;
} | null;

type ConfirmState =
  | {
      type: "service";
      id: number;
      name: string;
    }
  | {
      type: "category";
      id: number;
      name: string;
    }
  | null;

/* =========================================
   MAIN PAGE
========================================= */

export default function ServicesAdmin() {
  const [tree, setTree] =
    useState<ServiceGroup[] | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);

      const data =
        await admin.services.tree();

      setTree(data);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Couldn't load services."
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Services" />

      {/* INTRO */}

      <div className="mb-7 rounded-xl border border-line bg-cream px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-rose-deep">
            Service management
          </p>

          <h2 className="mt-1 font-display text-xl text-ink">
            Manage your salon services
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-relaxed text-taupe">
            Add service categories, create
            services, change prices and
            descriptions, or hide services
            from your website.
          </p>
        </div>

        {tree ? (
          <div className="mt-4 flex gap-2 sm:mt-0">
            <span className="rounded-full border border-line bg-pearl px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-taupe">
              {tree.length}{" "}
              {tree.length === 1
                ? "Category"
                : "Categories"}
            </span>

            <span className="rounded-full border border-line bg-pearl px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-taupe">
              {tree.reduce(
                (total, category) =>
                  total +
                  category.items.length,
                0
              )}{" "}
              Services
            </span>
          </div>
        ) : null}
      </div>

      {/* ADD CATEGORY */}

      <AddCategory onDone={load} />

      {/* ERROR */}

      {error ? (
        <Card className="mt-5 rounded-xl p-6">
          <div role="alert">
            <p className="text-sm font-medium text-rose-deep">
              Couldn't load services
            </p>

            <p className="mt-1 text-xs text-taupe">
              {error}
            </p>

            <Button
              type="button"
              className="mt-4"
              onClick={load}
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {/* LOADING */}

      {!tree && !error ? (
        <Loading />
      ) : null}

      {/* CATEGORIES */}

      {tree ? (
        <div className="mt-6 space-y-6">
          {tree.length === 0 ? (
            <Card className="rounded-xl p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blush text-xl text-rose-deep">
                +
              </div>

              <h3 className="mt-4 font-display text-xl text-ink">
                No service categories yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-taupe">
                Create your first category
                above, then you can start
                adding salon services.
              </p>
            </Card>
          ) : (
            tree.map((category) => (
              <CategoryBlock
                key={category.id}
                category={category}
                reload={load}
              />
            ))
          )}
        </div>
      ) : null}
    </>
  );
}

/* =========================================
   ADD CATEGORY
========================================= */

function AddCategory({
  onDone,
}: {
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [note, setNote] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState<Message>(null);

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setMessage({
        kind: "error",
        text: "Enter a category name.",
      });

      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await admin.categories.create({
        title: title.trim(),
        note: note.trim(),
      });

      setTitle("");
      setNote("");
      setOpen(false);

      await onDone();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Couldn't create category.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Card className="rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Service categories
            </p>

            <p className="mt-1 text-xs leading-relaxed text-taupe">
              Create groups such as Hair,
              Nails, Colour or Treatment.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setOpen(true);
              setMessage(null);
            }}
          >
            + Add category
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-rose-deep">
            New category
          </p>

          <h3 className="mt-1 font-display text-xl text-ink">
            Add service category
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setNote("");
            setMessage(null);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-taupe transition hover:border-taupe hover:text-ink"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-category-title"
              className={labelClass}
            >
              Category name
            </label>

            <input
              id="new-category-title"
              type="text"
              value={title}
              placeholder="Hair Services"
              className={inputClass}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label
              htmlFor="new-category-note"
              className={labelClass}
            >
              Short note
            </label>

            <input
              id="new-category-note"
              type="text"
              value={note}
              placeholder="Cuts, styling and care"
              className={inputClass}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {message ? (
          <p className="mt-4 text-xs text-rose-deep">
            {message.text}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Creating…"
              : "Create category"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              setTitle("");
              setNote("");
              setMessage(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* =========================================
   CATEGORY BLOCK
========================================= */

function CategoryBlock({
  category,
  reload,
}: {
  category: ServiceGroup;
  reload: () => Promise<void>;
}) {
  const [editing, setEditing] =
    useState(false);

  const [title, setTitle] =
    useState(category.title);

  const [note, setNote] =
    useState(category.note || "");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState<Message>(null);

  const [confirm, setConfirm] =
    useState<ConfirmState>(null);

  const saveCategory = async () => {
    if (!category.id) return;

    if (!title.trim()) {
      setMessage({
        kind: "error",
        text: "Category name is required.",
      });

      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await admin.categories.update(
        category.id,
        {
          title: title.trim(),
          note: note.trim(),
        }
      );

      setEditing(false);

      await reload();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Couldn't update category.",
      });
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory =
    async () => {
      if (
        !category.id ||
        busy
      ) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        await admin.categories.remove(
          category.id
        );

        setConfirm(null);

        await reload();
      } catch (error) {
        setConfirm(null);

        setMessage({
          kind: "error",
          text:
            error instanceof ApiError
              ? error.message
              : "Couldn't delete category.",
        });
      } finally {
        setBusy(false);
      }
    };

  const deleteService =
    async (id: number) => {
      if (busy) return;

      setBusy(true);
      setMessage(null);

      try {
        await admin.services.remove(
          id
        );

        setConfirm(null);

        await reload();
      } catch (error) {
        setConfirm(null);

        setMessage({
          kind: "error",
          text:
            error instanceof ApiError
              ? error.message
              : "Couldn't delete service.",
        });
      } finally {
        setBusy(false);
      }
    };

  return (
    <>
      <Card className="overflow-hidden rounded-xl">

        {/* CATEGORY HEADER */}

        <div className="border-b border-line bg-pearl/40 px-5 py-5 sm:px-6">
          {editing ? (
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className={labelClass}
                  >
                    Category name
                  </label>

                  <input
                    type="text"
                    value={title}
                    className={inputClass}
                    onChange={(event) =>
                      setTitle(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div>
                  <label
                    className={labelClass}
                  >
                    Short note
                  </label>

                  <input
                    type="text"
                    value={note}
                    className={inputClass}
                    onChange={(event) =>
                      setNote(
                        event.target
                          .value
                      )
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={
                    saveCategory
                  }
                >
                  {busy
                    ? "Saving…"
                    : "Save category"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false);

                    setTitle(
                      category.title
                    );

                    setNote(
                      category.note ||
                        ""
                    );

                    setMessage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl text-ink">
                    {category.title}
                  </h2>

                  <span className="rounded-full border border-line bg-cream px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-taupe">
                    {
                      category.items
                        .length
                    }{" "}
                    {category.items
                      .length === 1
                      ? "Service"
                      : "Services"}
                  </span>
                </div>

                {category.note ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-taupe">
                    {category.note}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditing(true);
                    setMessage(null);
                  }}
                >
                  Edit category
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      category.id
                    ) {
                      setConfirm({
                        type: "category",
                        id: category.id,
                        name:
                          category.title,
                      });
                    }
                  }}
                  className="rounded-md border border-rose/30 px-3 py-2 text-xs font-medium text-rose-deep transition hover:bg-rose/5"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY ERROR */}

        {message ? (
          <div className="border-b border-line bg-rose/5 px-5 py-3 sm:px-6">
            <p className="text-xs text-rose-deep">
              {message.text}
            </p>
          </div>
        ) : null}

        {/* SERVICES */}

        <div className="p-5 sm:p-6">
          {category.items.length >
          0 ? (
            <div className="space-y-3">
              {category.items.map(
                (item) => (
                  <ServiceRow
                    key={item.id}
                    item={item}
                    reload={reload}
                    onDelete={(
                      id,
                      name
                    ) =>
                      setConfirm({
                        type: "service",
                        id,
                        name,
                      })
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-pearl px-5 py-7 text-center">
              <p className="text-sm font-medium text-ink">
                No services yet
              </p>

              <p className="mt-1 text-xs text-taupe">
                Add your first
                service to this
                category below.
              </p>
            </div>
          )}

          {category.id ? (
            <AddService
              categoryId={
                category.id
              }
              onDone={reload}
            />
          ) : null}
        </div>
      </Card>

      {/* CONFIRM DELETE MODAL */}

      {confirm ? (
        <ConfirmDeleteModal
          title={
            confirm.type ===
            "category"
              ? "Delete category?"
              : "Delete service?"
          }
          description={
            confirm.type ===
            "category"
              ? `Are you sure you want to delete "${confirm.name}"? All services inside this category will also be deleted.`
              : `Are you sure you want to delete "${confirm.name}"?`
          }
          busy={busy}
          onCancel={() =>
            setConfirm(null)
          }
          onConfirm={() => {
            if (
              confirm.type ===
              "category"
            ) {
              deleteCategory();
            } else {
              deleteService(
                confirm.id
              );
            }
          }}
        />
      ) : null}
    </>
  );
}

/* =========================================
   ADD SERVICE
========================================= */

function AddService({
  categoryId,
  onDone,
}: {
  categoryId: number;
  onDone: () => Promise<void>;
}) {
  const [open, setOpen] =
    useState(false);

  const [name, setName] =
    useState("");

  const [detail, setDetail] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState<Message>(null);

  const close = () => {
    setOpen(false);
    setName("");
    setDetail("");
    setPrice("");
    setMessage(null);
  };

  const submit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage({
        kind: "error",
        text: "Enter a service name.",
      });

      return;
    }

    const numericPrice =
      Number(price);

    if (
      price.trim() === "" ||
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setMessage({
        kind: "error",
        text: "Enter a valid price.",
      });

      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await admin.services.create({
        category_id:
          categoryId,

        name: name.trim(),

        detail:
          detail.trim(),

        price: numericPrice,
      });

      close();

      await onDone();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Couldn't add service.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-pearl px-4 py-4 text-sm font-medium text-taupe transition hover:border-rose/50 hover:bg-rose/5 hover:text-rose-deep"
      >
        <span className="text-lg">
          +
        </span>

        Add service
      </button>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-line bg-cream p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-rose-deep">
            New service
          </p>

          <h3 className="mt-1 font-display text-lg text-ink">
            Add a service
          </h3>
        </div>

        <button
          type="button"
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-taupe transition hover:text-ink"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={submit}
        className="mt-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_180px]">

          <div>
            <label
              className={labelClass}
            >
              Service name
            </label>

            <input
              type="text"
              value={name}
              placeholder="Haircut"
              className={inputClass}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
            >
              Description
            </label>

            <input
              type="text"
              value={detail}
              placeholder="Short description"
              className={inputClass}
              onChange={(event) =>
                setDetail(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
            >
              Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe">
                ₱
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                placeholder="0"
                className={`${inputClass} pl-8`}
                onChange={(event) =>
                  setPrice(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>
        </div>

        {message ? (
          <p className="mt-3 text-xs text-rose-deep">
            {message.text}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Adding…"
              : "Add service"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

/* =========================================
   SERVICE ROW
========================================= */

function ServiceRow({
  item,
  reload,
  onDelete,
}: {
  item: ServiceItem;
  reload: () => Promise<void>;
  onDelete: (
    id: number,
    name: string
  ) => void;
}) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(item.name);

  const [detail, setDetail] =
    useState(item.detail || "");

  const [price, setPrice] =
    useState(
      String(item.price ?? "")
    );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const save = async () => {
    if (!item.id) return;

    if (!name.trim()) {
      setError(
        "Service name is required."
      );

      return;
    }

    const numericPrice =
      Number(price);

    if (
      price.trim() === "" ||
      !Number.isFinite(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setError(
        "Enter a valid price."
      );

      return;
    }

    setBusy(true);
    setError(null);

    try {
      await admin.services.update(
        item.id,
        {
          name: name.trim(),
          detail:
            detail.trim(),
          price: numericPrice,
        }
      );

      setEditing(false);

      await reload();
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Couldn't update service."
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    if (!item.id || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await admin.services.update(
        item.id,
        {
          is_active:
            !item.is_active,
        }
      );

      await reload();
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Couldn't change service visibility."
      );
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-rose/30 bg-rose/5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_180px]">
          <div>
            <label
              className={labelClass}
            >
              Service name
            </label>

            <input
              type="text"
              value={name}
              className={inputClass}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
            >
              Description
            </label>

            <input
              type="text"
              value={detail}
              className={inputClass}
              onChange={(event) =>
                setDetail(
                  event.target.value
                )
              }
            />
          </div>

          <div>
            <label
              className={labelClass}
            >
              Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe">
                ₱
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                className={`${inputClass} pl-8`}
                onChange={(event) =>
                  setPrice(
                    event.target
                      .value
                  )
                }
              />
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-xs text-rose-deep">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={save}
          >
            {busy
              ? "Saving…"
              : "Save"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setEditing(false);

              setName(item.name);

              setDetail(
                item.detail || ""
              );

              setPrice(
                String(
                  item.price ?? ""
                )
              );

              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-4 py-4 transition sm:px-5 ${
        item.is_active === false
          ? "border-line bg-pearl/50 opacity-65"
          : "border-line bg-cream"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* SERVICE INFO */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-ink">
              {item.name}
            </h3>

            {item.is_active ===
            false ? (
              <span className="rounded-full bg-taupe/10 px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-taupe">
                Hidden
              </span>
            ) : (
              <span className="rounded-full bg-blush px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-rose-deep">
                Visible
              </span>
            )}
          </div>

          {item.detail ? (
            <p className="mt-1 text-xs leading-relaxed text-taupe">
              {item.detail}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-taupe/60">
              No description
            </p>
          )}
        </div>

        {/* PRICE */}

        <div className="shrink-0 lg:w-[120px] lg:text-right">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-taupe">
            Price
          </p>

          <p className="mt-1 font-display text-xl text-ink">
            ₱
            {formatPrice(
              item.price
            )}
          </p>
        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 flex-wrap gap-2 lg:w-[245px] lg:justify-end">
          <button
            type="button"
            disabled={busy}
            title={
              item.is_active ===
              false
                ? "Show on site"
                : "Hide from site"
            }
            onClick={toggle}
            className="rounded-md border border-line bg-pearl px-3 py-2 text-xs font-medium text-taupe transition hover:border-taupe hover:text-ink disabled:opacity-50"
          >
            {busy
              ? "Updating…"
              : item.is_active ===
                  false
                ? "Show"
                : "Hide"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(true);
              setError(null);
            }}
            className="rounded-md border border-line bg-pearl px-3 py-2 text-xs font-medium text-ink transition hover:border-taupe disabled:opacity-50"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={
              busy || !item.id
            }
            onClick={() => {
              if (item.id) {
                onDelete(
                  item.id,
                  item.name
                );
              }
            }}
            className="rounded-md border border-rose/30 px-3 py-2 text-xs font-medium text-rose-deep transition hover:bg-rose/5 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 border-t border-line pt-3 text-xs text-rose-deep">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* =========================================
   DELETE MODAL
========================================= */

function ConfirmDeleteModal({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 px-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-cream shadow-2xl">
        <div className="border-b border-line px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose/10 text-lg text-rose-deep">
              !
            </div>

            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-rose-deep">
                Confirmation
              </p>

              <h3 className="mt-1 font-display text-xl text-ink">
                {title}
              </h3>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-taupe">
            {description}
          </p>

          <p className="mt-3 text-xs text-rose-deep">
            This action cannot be
            undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-pearl/50 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-md bg-rose-deep px-4 py-2 text-sm font-medium text-pearl transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Deleting…"
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   PRICE FORMAT
========================================= */

function formatPrice(
  value: string | number
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits:
        Number.isInteger(number)
          ? 0
          : 2,

      maximumFractionDigits: 2,
    }
  );
}