import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  admin,
  ApiError,
} from "../../api/client";

import {
  Card,
  EmptyState,
  Loading,
  PageHeader,
  inputClass,
} from "./ui";

import { cx } from "./utils";

type Photo = {
  id: number;
  url: string;
  alt: string;
  sort_order: number;
};

/* =========================================
   DELETE MODAL
========================================= */

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmModal({
  open,
  title,
  message,
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !busy
      ) {
        onCancel();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/55 px-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-delete-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-cream shadow-[0_30px_90px_-30px_rgba(23,18,15,0.55)]"
      >
        {/* HEADER */}

        <div className="flex items-start justify-between gap-5 border-b border-line px-6 py-5">
          <div>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-rose-deep">
              Permanent action
            </p>

            <h2
              id="gallery-delete-title"
              className="mt-2 font-display text-2xl text-ink"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            disabled={busy}
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-2xl font-light text-taupe transition hover:bg-pearl hover:text-ink disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {/* BODY */}

        <div className="px-6 py-6">
          <div className="text-sm leading-6 text-taupe">
            {message}
          </div>

          <div className="mt-5 rounded-lg border border-rose/20 bg-rose/5 px-4 py-3">
            <p className="text-xs leading-relaxed text-rose-deep">
              This photo will be
              permanently removed from
              your gallery.
            </p>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="flex justify-end gap-2 border-t border-line bg-pearl/40 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-md border border-line bg-cream px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-ink transition hover:bg-pearl disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-md border border-rose-deep bg-rose-deep px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Deleting..."
              : "Delete photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   GALLERY ADMIN
========================================= */

export default function GalleryAdmin() {
  const [photos, setPhotos] =
    useState<Photo[] | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(null);

  const [
    deletePhoto,
    setDeletePhoto,
  ] = useState<Photo | null>(null);

  const [dragging, setDragging] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const fileRef =
    useRef<HTMLInputElement>(null);

  /* =======================================
     LOAD GALLERY
  ======================================= */

  const load = useCallback(() => {
    admin.gallery
      .list()
      .then((data) => {
        setPhotos(data);
        setError(null);
      })
      .catch((e) => {
        setPhotos(null);

        setError(
          e instanceof ApiError
            ? e.message
            : "Couldn't load the gallery."
        );
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* =======================================
     UPLOAD
  ======================================= */

  const upload = async (
    files: FileList | File[]
  ) => {
    if (uploading) return;

    const selected =
      Array.from(files);

    const list =
      selected.filter(
        (file) =>
          [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
          ].includes(file.type) &&
          file.size > 0 &&
          file.size <=
            8 * 1024 * 1024
      );

    const rejected =
      selected.length -
      list.length;

    const validationMessage =
      rejected
        ? `${rejected} file${
            rejected === 1
              ? " was"
              : "s were"
          } skipped. Choose JPG, PNG, WebP, GIF or AVIF images up to 8 MB.`
        : null;

    setError(
      validationMessage
    );

    if (!list.length) {
      if (fileRef.current) {
        fileRef.current.value =
          "";
      }

      return;
    }

    setUploading(true);

    let uploadError:
      | string
      | null = null;

    try {
      for (const file of list) {
        await admin.gallery.upload(
          file,
          ""
        );
      }
    } catch (e) {
      uploadError =
        e instanceof ApiError
          ? e.message
          : "Upload failed. Please try again.";
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value =
          "";
      }

      try {
        const updatedPhotos =
          await admin.gallery.list();

        setPhotos(
          updatedPhotos
        );

        setError(
          uploadError ??
            validationMessage
        );
      } catch (e) {
        setPhotos(null);

        const refreshError =
          e instanceof ApiError
            ? e.message
            : "Couldn't refresh the gallery.";

        setError(
          uploadError
            ? `${uploadError} ${refreshError}`
            : refreshError
        );
      }
    }
  };

  /* =======================================
     OPEN DELETE MODAL
  ======================================= */

  const requestDelete = (
    photo: Photo
  ) => {
    if (deletingId !== null) {
      return;
    }

    setDeletePhoto(photo);
  };

  /* =======================================
     DELETE PHOTO
  ======================================= */

  const confirmDelete =
    async () => {
      if (!deletePhoto) {
        return;
      }

      const id =
        deletePhoto.id;

      setError(null);
      setDeletingId(id);

      try {
        await admin.gallery.remove(
          id
        );

        setPhotos((prev) =>
          prev?.filter(
            (photo) =>
              photo.id !== id
          ) ?? prev
        );

        setDeletePhoto(null);
      } catch (e) {
        const deleteError =
          e instanceof ApiError
            ? e.message
            : "Couldn't delete the photo.";

        setError(deleteError);

        try {
          setPhotos(
            await admin.gallery.list()
          );
        } catch (
          refreshError
        ) {
          setPhotos(null);

          const message =
            refreshError instanceof
            ApiError
              ? refreshError.message
              : "Couldn't refresh the gallery.";

          setError(
            `${deleteError} ${message}`
          );
        }
      } finally {
        setDeletingId(null);
      }
    };

  const photoCount =
    photos?.length ?? 0;

  /* =======================================
     PAGE
  ======================================= */

  return (
    <>
      <PageHeader title="Gallery" />

      {/* SUMMARY */}

      {photos !== null ? (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-cream px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">
              Your gallery
            </p>

            <p className="mt-0.5 text-xs text-taupe">
              Manage the photos
              displayed on your
              website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-pearl px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-taupe">
              {photoCount}{" "}
              {photoCount === 1
                ? "photo"
                : "photos"}
            </span>
          </div>
        </div>
      ) : null}

      {/* =================================
          UPLOAD DROPZONE
      ================================= */}

      <label
        onDragOver={(e) => {
          e.preventDefault();

          if (!uploading) {
            setDragging(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();

          setDragging(false);

          if (!uploading) {
            upload(
              e.dataTransfer
                .files
            );
          }
        }}
        className={cx(
          "group relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          uploading
            ? "cursor-wait border-line bg-pearl/60"
            : dragging
              ? "scale-[1.01] border-rose-deep bg-rose/5"
              : "border-line bg-cream hover:border-rose/60 hover:bg-blush/10"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            if (
              e.target.files
            ) {
              upload(
                e.target.files
              );
            }
          }}
        />

        {/* UPLOAD ICON */}

        <div
          className={cx(
            "flex h-12 w-12 items-center justify-center rounded-full transition",
            dragging
              ? "bg-rose-deep text-white"
              : "bg-blush text-rose-deep group-hover:bg-rose-deep group-hover:text-white"
          )}
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="text-2xl font-light">
              +
            </span>
          )}
        </div>

        <p className="mt-4 font-display text-xl text-ink">
          {uploading
            ? "Uploading photos..."
            : dragging
              ? "Drop your photos here"
              : "Add photos"}
        </p>

        <p className="mt-1 max-w-md text-xs leading-relaxed text-taupe">
          {uploading
            ? "Please wait while your images are being uploaded."
            : "Drag and drop your images here, or click to choose files from your computer."}
        </p>

        {!uploading ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-pearl px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-taupe">
              JPG
            </span>

            <span className="rounded-full bg-pearl px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-taupe">
              PNG
            </span>

            <span className="rounded-full bg-pearl px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-taupe">
              WebP
            </span>

            <span className="rounded-full bg-pearl px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-taupe">
              GIF
            </span>

            <span className="rounded-full bg-pearl px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-taupe">
              AVIF
            </span>

            <span className="text-[0.58rem] text-taupe">
              · Max 8 MB each
            </span>
          </div>
        ) : null}
      </label>

      {/* =================================
          ERROR
      ================================= */}

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose/20 bg-rose/5 px-4 py-3"
        >
          <p className="text-sm text-rose-deep">
            {error}
          </p>

          {photos === null ? (
            <button
              type="button"
              onClick={load}
              className="mt-2 text-xs font-medium uppercase tracking-[0.1em] text-rose-deep underline"
            >
              Retry loading gallery
            </button>
          ) : null}
        </div>
      ) : null}

      {/* =================================
          GALLERY SECTION
      ================================= */}

      <div className="mt-10">
        {/* SECTION TITLE */}

        {photos !== null &&
        photos.length > 0 ? (
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-rose-deep">
                Website photos
              </p>

              <h2 className="mt-1 font-display text-2xl text-ink">
                Gallery collection
              </h2>
            </div>

            <p className="hidden text-xs text-taupe sm:block">
              Click the description
              to edit it
            </p>
          </div>
        ) : null}

        {/* CONTENT */}

        {photos === null ? (
          <Loading />
        ) : photos.length ===
          0 ? (
          <Card className="overflow-hidden">
            <EmptyState>
              <div className="py-4">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blush text-xl text-rose-deep">
                  +
                </div>

                <p className="font-medium text-ink">
                  Your gallery is
                  empty
                </p>

                <p className="mt-1 text-sm text-taupe">
                  Upload a few
                  photos to fill
                  your website
                  gallery.
                </p>
              </div>
            </EmptyState>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {photos.map(
              (photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  number={
                    index + 1
                  }
                  busy={
                    uploading ||
                    deletingId ===
                      photo.id
                  }
                  onDelete={() =>
                    requestDelete(
                      photo
                    )
                  }
                  onError={
                    setError
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {/* =================================
          DELETE MODAL
      ================================= */}

      <ConfirmModal
        open={
          deletePhoto !== null
        }
        title="Delete photo?"
        busy={
          deletePhoto
            ? deletingId ===
              deletePhoto.id
            : false
        }
        onCancel={() => {
          if (
            deletingId === null
          ) {
            setDeletePhoto(
              null
            );
          }
        }}
        onConfirm={
          confirmDelete
        }
        message={
          <>
            Are you sure you want
            to permanently remove
            this photo from your
            gallery?

            {deletePhoto?.alt ? (
              <span className="mt-3 block rounded-md bg-pearl px-3 py-2 text-xs italic text-ink">
                "
                {
                  deletePhoto.alt
                }
                "
              </span>
            ) : null}
          </>
        }
      />
    </>
  );
}

/* =========================================
   PHOTO CARD
========================================= */

function PhotoCard({
  photo,
  number,
  busy,
  onDelete,
  onError,
}: {
  photo: Photo;
  number: number;
  busy: boolean;
  onDelete: () => void;
  onError: (
    message: string
  ) => void;
}) {
  const [alt, setAlt] =
    useState(photo.alt);

  const [
    savedAlt,
    setSavedAlt,
  ] = useState(photo.alt);

  const [saved, setSaved] =
    useState(false);

  const [
    savingAlt,
    setSavingAlt,
  ] = useState(false);

  useEffect(() => {
    setAlt(photo.alt);
    setSavedAlt(photo.alt);
  }, [
    photo.id,
    photo.alt,
  ]);

  /* =======================================
     SAVE DESCRIPTION
  ======================================= */

  const saveAlt =
    async () => {
      const newAlt =
        alt.trim();

      if (
        newAlt ===
          savedAlt.trim() ||
        savingAlt
      ) {
        return;
      }

      onError("");

      setSavingAlt(true);
      setSaved(false);

      try {
        await admin.gallery.update(
          photo.id,
          {
            alt: newAlt,
          }
        );

        setAlt(newAlt);
        setSavedAlt(newAlt);
        setSaved(true);

        window.setTimeout(
          () =>
            setSaved(false),
          1500
        );
      } catch (e) {
        onError(
          e instanceof ApiError
            ? e.message
            : "Couldn't update the photo description."
        );
      } finally {
        setSavingAlt(false);
      }
    };

  /* =======================================
     CARD
  ======================================= */

  return (
    <Card
      className={cx(
        "group overflow-hidden rounded-xl transition",
        busy
          ? "opacity-60"
          : "hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-30px_rgba(23,18,15,0.45)]"
      )}
    >
      {/* IMAGE */}

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush">
        <img
          src={photo.url}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />

        {/* NUMBER */}

        <div className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur">
          Photo{" "}
          {String(
            number
          ).padStart(2, "0")}
        </div>

        {/* BUSY OVERLAY */}

        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/25 backdrop-blur-[1px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream shadow">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-rose-deep border-t-transparent" />
            </div>
          </div>
        ) : null}
      </div>

      {/* INFORMATION */}

      <div className="p-4">
        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-taupe">
              Description
            </span>

            <span
              className={cx(
                "text-[0.58rem] font-medium uppercase tracking-[0.1em] transition",
                saved
                  ? "text-rose-deep"
                  : "text-taupe"
              )}
            >
              {savingAlt
                ? "Saving..."
                : saved
                  ? "Saved ✓"
                  : alt !==
                      savedAlt
                    ? "Unsaved"
                    : ""}
            </span>
          </div>

          <input
            value={alt}
            onChange={(e) => {
              setAlt(
                e.target.value
              );

              setSaved(false);
            }}
            onBlur={saveAlt}
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                e.currentTarget.blur();
              }
            }}
            maxLength={255}
            disabled={
              busy || savingAlt
            }
            placeholder="Describe this photo..."
            className={cx(
              inputClass,
              "text-xs"
            )}
            aria-label="Photo description"
          />
        </label>

        {/* FOOTER */}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <p className="text-[0.58rem] uppercase tracking-[0.12em] text-taupe">
            Gallery image
          </p>

          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-md border border-rose/30 px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-rose-deep transition hover:border-rose-deep/50 hover:bg-rose/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}