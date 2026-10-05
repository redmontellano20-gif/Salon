import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  admin,
  ApiError,
} from "../../api/client";

import type { Settings } from "../../api/types";

import {
  Button,
  Card,
  Loading,
  PageHeader,
  inputClass,
  labelClass,
} from "./ui";

import { useAdminContext } from "./admin-context";

type Field = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=1500";

const DEFAULT_ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1500";

const DEFAULT_SMALL_ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800";

const BRAND_GROUP: {
  title: string;
  note: string;
  fields: Field[];
} = {
  title: "Brand",
  note: "Your salon name is shown across the website.",
  fields: [
    {
      key: "brand_name",
      label: "Salon name",
      placeholder: "Enter salon name",
    },
  ],
};

const NAVIGATION_GROUP: {
  title: string;
  note: string;
  fields: Field[];
} = {
  title: "Navigation",
  note: "These labels appear in the public site menu.",
  fields: [
    {
      key: "nav_home",
      label: "Home",
    },
    {
      key: "nav_about",
      label: "About",
    },
    {
      key: "nav_services",
      label: "Services",
    },
    {
      key: "nav_gallery",
      label: "Gallery",
    },
    {
      key: "nav_book",
      label: "Book",
    },
  ],
};

const OTHER_GROUPS: {
  title: string;
  note?: string;
  fields: Field[];
}[] = [
  {
    title: "About Content",
    note: "Change the title and description shown in the About section.",
    fields: [
      {
        key: "about_eyebrow",
        label: "Small heading",
        placeholder: "The Atelier",
      },
      {
        key: "about_title",
        label: "Main title",
        placeholder: "A quiet room on",
      },
      {
        key: "about_title_accent",
        label: "Italic title",
        placeholder: "Rue de la Lumière",
      },
      {
        key: "about_description_1",
        label: "Description 1",
        placeholder: "Write your salon story...",
        multiline: true,
      },
      {
        key: "about_description_2",
        label: "Description 2",
        placeholder: "Write more about your salon...",
        multiline: true,
      },
    ],
  },
  {
    title: "Location",
    note: "The address customers will see on your website.",
    fields: [
      {
        key: "address_1",
        label: "Address line 1",
        placeholder: "Street, building or area",
      },
      {
        key: "address_2",
        label: "Address line 2",
        placeholder: "City, province or additional address",
      },
    ],
  },
  {
    title: "Opening hours",
    note: "Let customers know when your salon is open.",
    fields: [
      {
        key: "hours_1",
        label: "Line 1",
        placeholder: "Tue–Fri · 9–7",
      },
      {
        key: "hours_2",
        label: "Line 2",
        placeholder: "Sat 9–6 · Sun 10–5",
      },
      {
        key: "hours_3",
        label: "Line 3",
        placeholder: "Monday closed",
      },
    ],
  },
  {
    title: "Contact",
    note: "Contact information displayed to your customers.",
    fields: [
      {
        key: "phone",
        label: "Phone",
        placeholder: "Enter phone number",
      },
      {
        key: "email",
        label: "Email",
        placeholder: "Enter email address",
      },
    ],
  },
  {
    title: "Social Media",
    note: "Add the links shown in the Follow section of your website footer.",
    fields: [
      {
        key: "facebook_url",
        label: "Facebook",
        placeholder: "https://facebook.com/yourusername",
      },
      {
        key: "instagram_url",
        label: "Instagram",
        placeholder: "https://instagram.com/yourusername",
      },
      {
        key: "tiktok_url",
        label: "TikTok",
        placeholder: "https://tiktok.com/@yourusername",
      },
    ],
  },
];

const ALL_GROUPS = [
  BRAND_GROUP,
  NAVIGATION_GROUP,
  ...OTHER_GROUPS,
];

const ALL_KEYS = ALL_GROUPS.flatMap((group) =>
  group.fields.map((field) => field.key)
);

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export default function SettingsAdmin() {
  const {
    settings,
    setSettings,
    refreshSettings,
  } = useAdminContext();

  const [values, setValues] =
    useState<Settings | null>(null);

  const [busy, setBusy] =
    useState(false);

  const [
    heroUploading,
    setHeroUploading,
  ] = useState(false);

  const [
    heroDragging,
    setHeroDragging,
  ] = useState(false);

  const [
    aboutUploading,
    setAboutUploading,
  ] = useState(false);

  const [
    aboutDragging,
    setAboutDragging,
  ] = useState(false);

  const [
    aboutSmallUploading,
    setAboutSmallUploading,
  ] = useState(false);

  const [
    aboutSmallDragging,
    setAboutSmallDragging,
  ] = useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<{
      kind: "ok" | "error";
      msg: string;
    } | null>(null);

  const [
    hasChanges,
    setHasChanges,
  ] = useState(false);

  /* PENDING IMAGES */

  const [
    pendingHero,
    setPendingHero,
  ] = useState<File | null>(null);

  const [
    pendingAbout,
    setPendingAbout,
  ] = useState<File | null>(null);

  const [
    pendingAboutSmall,
    setPendingAboutSmall,
  ] = useState<File | null>(null);

  /* LOCAL PREVIEWS */

  const [
    heroPreview,
    setHeroPreview,
  ] = useState<string | null>(null);

  const [
    aboutPreview,
    setAboutPreview,
  ] = useState<string | null>(null);

  const [
    aboutSmallPreview,
    setAboutSmallPreview,
  ] = useState<string | null>(null);

  const heroInputRef =
    useRef<HTMLInputElement>(null);

  const aboutInputRef =
    useRef<HTMLInputElement>(null);

  const aboutSmallInputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;

    const seed: Settings = {
      ...settings,
    };

    for (const key of ALL_KEYS) {
      seed[key] =
        settings[key] ?? "";
    }

    seed.hero_image =
      settings.hero_image ?? "";

    seed.about_image =
      settings.about_image ?? "";

    seed.about_small_image =
      settings.about_small_image ?? "";

    setValues(seed);
    setLoadError(null);
  }, [settings]);

  useEffect(() => {
    if (settings) return;

    refreshSettings().catch(() => {
      setLoadError(
        "Couldn't load settings."
      );
    });
  }, [
    settings,
    refreshSettings,
  ]);

  /* CLEAN OBJECT URLS */

  useEffect(() => {
    return () => {
      if (heroPreview) {
        URL.revokeObjectURL(
          heroPreview
        );
      }

      if (aboutPreview) {
        URL.revokeObjectURL(
          aboutPreview
        );
      }

      if (aboutSmallPreview) {
        URL.revokeObjectURL(
          aboutSmallPreview
        );
      }
    };
  }, [
    heroPreview,
    aboutPreview,
    aboutSmallPreview,
  ]);

  const set = (
    key: string,
    value: string
  ) => {
    setValues((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [key]: value,
      };
    });

    /*
      Do not update the client website yet.
      Changes are applied after Save.
    */

    setHasChanges(true);
    setStatus(null);
  };

  const validateImage = (
    file: File
  ) => {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      setStatus({
        kind: "error",
        msg: "Choose a JPG, PNG, WebP, GIF or AVIF image.",
      });

      return false;
    }

    if (
      file.size <= 0 ||
      file.size > MAX_IMAGE_SIZE
    ) {
      setStatus({
        kind: "error",
        msg: "The image must be 8 MB or smaller.",
      });

      return false;
    }

    return true;
  };

  /* =========================================
     SELECT HERO IMAGE
     PREVIEW ONLY - NO UPLOAD YET
  ========================================= */

  const uploadHero = (
    file: File
  ) => {
    if (!validateImage(file)) {
      return;
    }

    if (heroPreview) {
      URL.revokeObjectURL(
        heroPreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setPendingHero(file);
    setHeroPreview(preview);

    setHasChanges(true);
    setStatus(null);

    if (heroInputRef.current) {
      heroInputRef.current.value =
        "";
    }
  };

  /* =========================================
     SELECT ABOUT IMAGE
     PREVIEW ONLY - NO UPLOAD YET
  ========================================= */

  const uploadAbout = (
    file: File
  ) => {
    if (!validateImage(file)) {
      return;
    }

    if (aboutPreview) {
      URL.revokeObjectURL(
        aboutPreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setPendingAbout(file);
    setAboutPreview(preview);

    setHasChanges(true);
    setStatus(null);

    if (aboutInputRef.current) {
      aboutInputRef.current.value =
        "";
    }
  };

  /* =========================================
     SELECT SMALL ABOUT IMAGE
     PREVIEW ONLY - NO UPLOAD YET
  ========================================= */

  const uploadAboutSmall = (
    file: File
  ) => {
    if (!validateImage(file)) {
      return;
    }

    if (aboutSmallPreview) {
      URL.revokeObjectURL(
        aboutSmallPreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    setPendingAboutSmall(file);
    setAboutSmallPreview(preview);

    setHasChanges(true);
    setStatus(null);

    if (
      aboutSmallInputRef.current
    ) {
      aboutSmallInputRef.current.value =
        "";
    }
  };

  /* =========================================
     SAVE
     IMAGES UPLOAD ONLY AFTER CLICKING SAVE
  ========================================= */

  const save = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!values) return;

    setBusy(true);
    setStatus(null);

    try {
      let nextValues: Settings = {
        ...values,
      };

      /*
        HERO
      */

      if (pendingHero) {
        setHeroUploading(true);

        const result =
          await admin.hero.upload(
            pendingHero
          );

        nextValues = {
          ...nextValues,
          ...result.settings,
          hero_image: result.url,
        };
      }

      /*
        ABOUT
      */

      if (pendingAbout) {
        setAboutUploading(true);

        const result =
          await admin.about.upload(
            pendingAbout
          );

        nextValues = {
          ...nextValues,
          ...result.settings,
          about_image: result.url,
        };
      }

      /*
        SMALL ABOUT
      */

      if (pendingAboutSmall) {
        setAboutSmallUploading(
          true
        );

        const result =
          await admin.aboutSmall.upload(
            pendingAboutSmall
          );

        nextValues = {
          ...nextValues,
          ...result.settings,
          about_small_image:
            result.url,
        };
      }

      /*
        SAVE SETTINGS
      */

      const saved =
        await admin.settings.save(
          nextValues
        );

      setSettings(saved);
      setValues(saved);

      /*
        CLEAR PENDING FILES
      */

      setPendingHero(null);
      setPendingAbout(null);
      setPendingAboutSmall(null);

      if (heroPreview) {
        URL.revokeObjectURL(
          heroPreview
        );
      }

      if (aboutPreview) {
        URL.revokeObjectURL(
          aboutPreview
        );
      }

      if (aboutSmallPreview) {
        URL.revokeObjectURL(
          aboutSmallPreview
        );
      }

      setHeroPreview(null);
      setAboutPreview(null);
      setAboutSmallPreview(null);

      setHasChanges(false);

      setStatus({
        kind: "ok",
        msg: "Settings saved successfully. Your changes are now live.",
      });
    } catch (error) {
      setStatus({
        kind: "error",
        msg:
          error instanceof ApiError
            ? error.message
            : "Couldn't save. Please try again.",
      });
    } finally {
      setBusy(false);

      setHeroUploading(false);
      setAboutUploading(false);
      setAboutSmallUploading(false);
    }
  };

  const renderFields = (
    group: {
      title: string;
      note?: string;
      fields: Field[];
    },
    number: number
  ) => (
    <Card
      key={group.title}
      className="overflow-hidden rounded-xl"
    >
      <div className="border-b border-line bg-pearl/40 px-5 py-4 sm:px-6">

        <div className="flex items-start gap-4">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush font-display text-sm text-rose-deep">
            {String(number).padStart(
              2,
              "0"
            )}
          </div>

          <div>
            <h2 className="font-display text-xl text-ink">
              {group.title}
            </h2>

            {group.note ? (
              <p className="mt-1 text-xs leading-relaxed text-taupe">
                {group.note}
              </p>
            ) : null}
          </div>

        </div>

      </div>

      <div className="p-5 sm:p-6">

        <div
          className={`grid gap-x-5 gap-y-5 ${
            group.fields.length === 1
              ? "max-w-xl"
              : "sm:grid-cols-2"
          }`}
        >

          {group.fields.map(
            (field) => (

              <div
                key={field.key}
                className={
                  field.multiline
                    ? "sm:col-span-2"
                    : ""
                }
              >

                <label
                  htmlFor={field.key}
                  className={labelClass}
                >
                  {field.label}
                </label>

                {field.multiline ? (

                  <textarea
                    id={field.key}
                    name={field.key}
                    value={
                      values?.[
                        field.key
                      ] ?? ""
                    }
                    placeholder={
                      field.placeholder
                    }
                    rows={5}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(event) =>
                      set(
                        field.key,
                        event.target.value
                      )
                    }
                    className={`${inputClass} min-h-[130px] resize-y`}
                  />

                ) : (

                  <input
                    id={field.key}
                    name={field.key}
                    type={
                      field.key ===
                      "email"
                        ? "email"
                        : field.key ===
                            "phone"
                          ? "tel"
                          : field.key.endsWith(
                                "_url"
                              )
                            ? "url"
                            : "text"
                    }
                    value={
                      values?.[
                        field.key
                      ] ?? ""
                    }
                    placeholder={
                      field.placeholder
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(event) =>
                      set(
                        field.key,
                        event.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  />

                )}

              </div>

            )
          )}

        </div>

      </div>

    </Card>
  );

  if (!values) {
    return (
      <>
        <PageHeader title="Settings" />

        {loadError ? (

          <Card className="rounded-xl p-6">

            <div
              role="alert"
              className="text-sm"
            >
              <p className="font-medium text-rose-deep">
                Couldn't load settings
              </p>

              <p className="mt-1 text-xs text-taupe">
                Something went wrong while
                loading your salon settings.
              </p>

              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  setLoadError(null);
                  refreshSettings();
                }}
              >
                Retry
              </Button>
            </div>

          </Card>

        ) : (

          <Loading />

        )}
      </>
    );
  }

  /*
    Local preview is displayed in Admin.
    Saved image stays on client website
    until Save Changes is clicked.
  */

  const heroImage =
    heroPreview ||
    values.hero_image?.trim() ||
    DEFAULT_HERO;

  const aboutImage =
    aboutPreview ||
    values.about_image?.trim() ||
    DEFAULT_ABOUT_IMAGE;

  const aboutSmallImage =
    aboutSmallPreview ||
    values.about_small_image?.trim() ||
    DEFAULT_SMALL_ABOUT_IMAGE;

  return (
    <form
      onSubmit={save}
      autoComplete="off"
    >

      <PageHeader title="Settings" />

      {/* HEADER */}

      <div className="mb-7 rounded-xl border border-line bg-cream px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-6">

        <div>

          <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-rose-deep">
            Salon configuration
          </p>

          <h2 className="mt-1 font-display text-xl text-ink">
            Manage your website
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-relaxed text-taupe">
            Manage your brand, navigation,
            homepage images, About section,
            salon information, contact
            information and social media
            links.
          </p>

        </div>

        <div className="mt-4 sm:mt-0">

          {hasChanges ? (

            <span className="inline-flex items-center gap-2 rounded-full border border-rose/30 bg-rose/5 px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-rose-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-deep" />
              Unsaved changes
            </span>

          ) : (

            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-pearl px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-taupe">
              <span className="h-1.5 w-1.5 rounded-full bg-taupe" />
              Up to date
            </span>

          )}

        </div>

      </div>

      {/* STATUS */}

      {status ? (

        <div
          role="status"
          className={`mb-6 rounded-lg border px-4 py-3 ${
            status.kind === "ok"
              ? "border-line bg-cream"
              : "border-rose/30 bg-rose/5"
          }`}
        >

          <div className="flex items-start gap-3">

            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                status.kind === "ok"
                  ? "bg-blush text-ink"
                  : "bg-rose/10 text-rose-deep"
              }`}
            >
              {status.kind === "ok"
                ? "✓"
                : "!"}
            </div>

            <div>

              <p
                className={`text-sm font-medium ${
                  status.kind === "ok"
                    ? "text-ink"
                    : "text-rose-deep"
                }`}
              >
                {status.kind === "ok"
                  ? "Changes saved"
                  : "Something went wrong"}
              </p>

              <p className="mt-0.5 text-xs text-taupe">
                {status.msg}
              </p>

            </div>

          </div>

        </div>

      ) : null}

      <div className="space-y-5">

        {/* 01 BRAND */}

        {renderFields(
          BRAND_GROUP,
          1
        )}

        {/* 02 NAVIGATION */}

        {renderFields(
          NAVIGATION_GROUP,
          2
        )}

        {/* 03 HERO IMAGE */}

        <Card className="overflow-hidden rounded-xl">

          <div className="border-b border-line bg-pearl/40 px-5 py-4 sm:px-6">

            <div className="flex items-start gap-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush font-display text-sm text-rose-deep">
                03
              </div>

              <div>
                <h2 className="font-display text-xl text-ink">
                  Hero Image
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-taupe">
                  Change the main portrait
                  shown on your homepage.
                </p>
              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">

              <div>

                <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-taupe">
                  {pendingHero
                    ? "New image preview"
                    : "Current image"}
                </p>

                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line bg-blush">

                  <img
                    src={heroImage}
                    alt="Homepage hero"
                    className="h-full w-full object-cover"
                  />

                  {heroUploading ? (

                    <div className="absolute inset-0 flex items-center justify-center bg-ink/50">

                      <div className="text-center text-pearl">

                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-pearl/30 border-t-pearl" />

                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.14em]">
                          Uploading
                        </p>

                      </div>

                    </div>

                  ) : null}

                </div>

              </div>

              <div>

                <p className="text-sm font-medium text-ink">
                  Homepage portrait
                </p>

                <p className="mt-1 max-w-md text-xs leading-relaxed text-taupe">
                  Choose a clear vertical
                  image for your homepage.
                  It will only go live after
                  you click Save changes.
                </p>

                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setHeroDragging(true);
                  }}
                  onDragLeave={() =>
                    setHeroDragging(false)
                  }
                  onDrop={(event) => {
                    event.preventDefault();

                    setHeroDragging(false);

                    const file =
                      event.dataTransfer
                        .files[0];

                    if (file) {
                      uploadHero(file);
                    }
                  }}
                  className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
                    heroDragging
                      ? "border-rose-deep bg-rose/5"
                      : "border-line bg-pearl hover:border-taupe"
                  }`}
                >

                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        uploadHero(file);
                      }
                    }}
                  />

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-lg text-rose-deep">
                    ↑
                  </div>

                  <p className="mt-3 text-sm font-medium text-ink">
                    {pendingHero
                      ? "Choose another image"
                      : "Choose a new image"}
                  </p>

                  <p className="mt-1 text-xs text-taupe">
                    Click or drag an image
                    here
                  </p>

                  <p className="mt-3 text-[0.6rem] uppercase tracking-[0.1em] text-taupe">
                    JPG · PNG · WEBP · GIF ·
                    AVIF · MAX 8 MB
                  </p>

                </label>

              </div>

            </div>

          </div>

        </Card>

        {/* 04 ABOUT IMAGE */}

        <Card className="overflow-hidden rounded-xl">

          <div className="border-b border-line bg-pearl/40 px-5 py-4 sm:px-6">

            <div className="flex items-start gap-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush font-display text-sm text-rose-deep">
                04
              </div>

              <div>

                <h2 className="font-display text-xl text-ink">
                  About Image
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-taupe">
                  Change the large image
                  displayed in the About
                  section.
                </p>

              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">

              <div>

                <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-taupe">
                  {pendingAbout
                    ? "New image preview"
                    : "Current image"}
                </p>

                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line bg-blush">

                  <img
                    src={aboutImage}
                    alt="About section"
                    className="h-full w-full object-cover"
                  />

                  {aboutUploading ? (

                    <div className="absolute inset-0 flex items-center justify-center bg-ink/50">

                      <div className="text-center text-pearl">

                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-pearl/30 border-t-pearl" />

                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.14em]">
                          Uploading
                        </p>

                      </div>

                    </div>

                  ) : null}

                </div>

              </div>

              <div>

                <p className="text-sm font-medium text-ink">
                  About section image
                </p>

                <p className="mt-1 max-w-md text-xs leading-relaxed text-taupe">
                  Upload the main salon image
                  shown beside your About
                  story. The original image
                  colors will be kept.
                </p>

                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setAboutDragging(true);
                  }}
                  onDragLeave={() =>
                    setAboutDragging(false)
                  }
                  onDrop={(event) => {
                    event.preventDefault();

                    setAboutDragging(false);

                    const file =
                      event.dataTransfer
                        .files[0];

                    if (file) {
                      uploadAbout(file);
                    }
                  }}
                  className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
                    aboutDragging
                      ? "border-rose-deep bg-rose/5"
                      : "border-line bg-pearl hover:border-taupe"
                  }`}
                >

                  <input
                    ref={aboutInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        uploadAbout(file);
                      }
                    }}
                  />

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-lg text-rose-deep">
                    ↑
                  </div>

                  <p className="mt-3 text-sm font-medium text-ink">
                    {pendingAbout
                      ? "Choose another image"
                      : "Choose a new image"}
                  </p>

                  <p className="mt-1 text-xs text-taupe">
                    Click or drag an image
                    here
                  </p>

                  <p className="mt-3 text-[0.6rem] uppercase tracking-[0.1em] text-taupe">
                    JPG · PNG · WEBP · GIF ·
                    AVIF · MAX 8 MB
                  </p>

                </label>

                <div className="mt-4 rounded-lg bg-pearl px-4 py-3">

                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-taupe">
                    Recommended
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-taupe">
                    Use a high-quality vertical
                    image around a 4:5 ratio.
                    The original image colors
                    will be displayed.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </Card>

        {/* 05 SMALL ABOUT IMAGE */}

        <Card className="overflow-hidden rounded-xl">

          <div className="border-b border-line bg-pearl/40 px-5 py-4 sm:px-6">

            <div className="flex items-start gap-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush font-display text-sm text-rose-deep">
                05
              </div>

              <div>

                <h2 className="font-display text-xl text-ink">
                  Small About Image
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-taupe">
                  Change the small picture
                  that overlaps the
                  bottom-right of the main
                  About image.
                </p>

              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">

              <div>

                <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-taupe">
                  {pendingAboutSmall
                    ? "New image preview"
                    : "Current image"}
                </p>

                <div className="relative aspect-square overflow-hidden rounded-lg border-4 border-pearl bg-blush shadow-md">

                  <img
                    src={aboutSmallImage}
                    alt="Small About"
                    className="h-full w-full object-cover"
                  />

                  {aboutSmallUploading ? (

                    <div className="absolute inset-0 flex items-center justify-center bg-ink/50">

                      <div className="text-center text-pearl">

                        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-pearl/30 border-t-pearl" />

                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.14em]">
                          Uploading
                        </p>

                      </div>

                    </div>

                  ) : null}

                </div>

              </div>

              <div>

                <p className="text-sm font-medium text-ink">
                  Overlapping About picture
                </p>

                <p className="mt-1 max-w-md text-xs leading-relaxed text-taupe">
                  Upload the small square
                  picture shown on the
                  bottom-right of your main
                  About image. The original
                  colors will be kept.
                </p>

                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setAboutSmallDragging(
                      true
                    );
                  }}
                  onDragLeave={() =>
                    setAboutSmallDragging(
                      false
                    )
                  }
                  onDrop={(event) => {
                    event.preventDefault();

                    setAboutSmallDragging(
                      false
                    );

                    const file =
                      event.dataTransfer
                        .files[0];

                    if (file) {
                      uploadAboutSmall(
                        file
                      );
                    }
                  }}
                  className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
                    aboutSmallDragging
                      ? "border-rose-deep bg-rose/5"
                      : "border-line bg-pearl hover:border-taupe"
                  }`}
                >

                  <input
                    ref={
                      aboutSmallInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={(event) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        uploadAboutSmall(
                          file
                        );
                      }
                    }}
                  />

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-lg text-rose-deep">
                    ↑
                  </div>

                  <p className="mt-3 text-sm font-medium text-ink">
                    {pendingAboutSmall
                      ? "Choose another image"
                      : "Choose a new image"}
                  </p>

                  <p className="mt-1 text-xs text-taupe">
                    Click or drag an image
                    here
                  </p>

                  <p className="mt-3 text-[0.6rem] uppercase tracking-[0.1em] text-taupe">
                    JPG · PNG · WEBP · GIF ·
                    AVIF · MAX 8 MB
                  </p>

                </label>

                <div className="mt-4 rounded-lg bg-pearl px-4 py-3">

                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-taupe">
                    Recommended
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-taupe">
                    Use a square image around
                    a 1:1 ratio. The original
                    image colors will be
                    displayed.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </Card>

        {/* 06 - 10 OTHER SETTINGS */}

        {OTHER_GROUPS.map(
          (
            group,
            groupIndex
          ) =>
            renderFields(
              group,
              groupIndex + 6
            )
        )}

      </div>

      {/* SAVE BAR */}

      <div className="sticky bottom-4 z-20 mt-7">

        <div className="flex flex-col gap-4 rounded-xl border border-line bg-cream/95 px-5 py-4 shadow-[0_20px_60px_-35px_rgba(23,18,15,0.55)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-medium text-ink">
              {hasChanges
                ? "You have unsaved changes"
                : "Everything is saved"}
            </p>

            <p className="mt-0.5 text-xs text-taupe">
              {hasChanges
                ? "Click Save changes to publish them to your website."
                : "Your website settings are up to date."}
            </p>

          </div>

          <Button
            type="submit"
            disabled={
              busy ||
              !hasChanges
            }
            className="min-w-[150px]"
          >
            {busy
              ? "Saving…"
              : hasChanges
                ? "Save changes"
                : "Saved ✓"}
          </Button>

        </div>

      </div>

    </form>
  );
}