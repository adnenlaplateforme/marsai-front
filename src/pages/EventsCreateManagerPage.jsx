import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import TitlePage from "../components/base/TitlePage";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import FormSection from "../components/MovieSubmit/base/FormSection";
import FormErrors from "../components/MovieSubmit/base/FormErrors";
import BasicFormInput from "../components/MovieSubmit/base/BasicFormInput";
import FormTextArea from "../components/MovieSubmit/base/FormTextArea";
import { useApi } from "../hooks/useApi";
import { useState } from "react";
import toast from "react-hot-toast";

function EventsCreateManagerPage() {
    const form = useForm({
        criteriaMode: 'all',
    });
    const [error, setError] = useState(null);
    const {
        // register,
        handleSubmit,
        formState: { isSubmitting },
    } = form;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const api = useApi();

    function getToday() {
        let now = new Date();
        let y = now.getFullYear();
        let m = now.getMonth() + 1;
        let d = now.getDate();
        now.setHours(9);
        let h = now.getHours();
        m = m < 10 ? "0" + m : m;
        d = d < 10 ? "0" + d : d;
        h = h < 10 ? "0" + h : h;
        let ret = "" + y + "-" + m + "-" + d + "T" + h + ":00"
        console.log(ret);
        // console.log(new Date());
        return ret;
    }


    async function onSubmit(data) {
        try {
            const res = await api("/events",
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Un formulaire HTML ne rend que des chaînes, là où
                    // CreateEventRequestSchema attend deux entiers et un
                    // booléen : envoyé tel quel, "60" et "true" repartent en 400.
                    body: JSON.stringify({
                        ...data,
                        duration: Number(data.duration),
                        capacity: Number(data.capacity),
                        isBookable: data.isBookable === 'true',
                    }),
                }
            );

            // `useApi` rend null quand la session est morte : il a déjà déconnecté.
            if (!res) return;

            if (res.ok) {
                toast.success("Event ajoute");
                navigate('/admin/events');
            }
            else {
                toast.error("Un probleme est survenu");
            }

        } catch (e) {
            console.error('error: ', e);
            toast.error("Un probleme est survenu");
        }


    }
    return (
        <>
            {/* <TopPageTwo /> */}
            <div className="pb-25 pt-10 flex flex-col items-center text-white">
                <div className="flex flex-col items-center w-5/6 gap-4 pb-4">
                    <div className="flex gap-2 items-center uppercase mb-6">
                        <p className="text-white font-thin text-lg">
                        </p>
                    </div>
                    <TitlePage className="">
                        Creer un event

                    </TitlePage>
                    {/* <p className="max-w-lg text-center">lujljlk</p> */}
                </div>
                <form
                    className="flex flex-col items-center gap-7 w-full"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                >


                    <FormSection className=" text-zinc-200">
                        {/* <FormSectionTitle text="section 1" /> */}
                        <div className="flex flex-col w-full gap-3 pb-4">
                            <p>Type d&apos;evenement</p>
                            <div className="flex flex-row justify-around gap-3 w-full">
                                <label
                                    className="flex items-center justify-center h-24 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:text-white has-checked:border-accent w-1/2 p-1 "
                                    htmlFor="form-conference"
                                >
                                    Conference
                                    <input
                                        className=" appearance-none"
                                        type="radio"
                                        id="form-conference"
                                        name="isBookable"
                                        value={false}
                                        {...form.register('isBookable', {
                                            required: "champ obligatoire",
                                        })}
                                    ></input>
                                </label>
                                <label
                                    className="flex items-center justify-center h-24 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:text-white has-checked:border-accent w-1/2 p-1 "
                                    htmlFor="form-workshop"
                                >
                                    Workshop
                                    <input
                                        className=" appearance-none"
                                        type="radio"
                                        id="form-workshop"
                                        name="isBookable"
                                        value={true}
                                        {...form.register('isBookable', {
                                            required: "champ obligatoire",
                                        })}
                                    ></input>
                                </label>
                            </div>

                            <FormErrors className="self-center" form={form} name="isHybrid" />
                        </div>

                        <div className="flex flex-col w-full gap-3 pb-4">
                            <p>Langue</p>
                            <div className="flex flex-row justify-around gap-3 w-full">
                                <label
                                    className="flex items-center justify-center h-24 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:text-white has-checked:border-accent w-1/2 p-1 "
                                    htmlFor="form-fr"
                                >
                                    Français 🇫🇷
                                    <input
                                        className=" appearance-none"
                                        type="radio"
                                        id="form-fr"
                                        name="lang"
                                        value="FR"
                                        {...form.register('lang', {
                                            required: "champ obligatoire",
                                        })}
                                    ></input>
                                </label>
                                <label
                                    className="flex items-center justify-center h-24 border border-gray rounded-sm cursor-pointer has-checked:bg-secondary has-checked:text-white has-checked:border-accent w-1/2 p-1 "
                                    htmlFor="form-en"
                                >
                                    Anglais 🇬🇧
                                    <input
                                        className=" appearance-none"
                                        type="radio"
                                        id="form-en"
                                        name="lang"
                                        value="EN"
                                        {...form.register('lang', {
                                            required: "champ obligatoire",
                                        })}
                                    ></input>
                                </label>
                            </div>

                            <FormErrors className="self-center" form={form} name="isHybrid" />
                        </div>

                        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
                            <BasicFormInput
                                label="Titre de l'evenement"
                                id="form-title"
                                placeholder="Titre de l'evenement"
                                title="Titre de l'evenement"
                                form={form}
                                name="title"
                                validation={{
                                    required: "champ obligatoire",
                                    minLength: {
                                        value: 3,
                                        message: "Minimum 3 caracteres",
                                    },
                                    maxLength: {
                                        value: 100,
                                        message: "Maximum 100 caracteres",
                                    },
                                }}
                            />

                            <BasicFormInput
                                label="Location de l'evenement"
                                id="form-location"
                                placeholder="Location de l'evenement"
                                title="Location de l'evenement"
                                form={form}
                                name="location"
                                validation={{
                                    required: "champ obligatoire",
                                    minLength: {
                                        value: 3,
                                        message: "Minimum 3 caracteres",
                                    },
                                    maxLength: {
                                        value: 255,
                                        message: "Maximum 255 caracteres",
                                    },
                                }}
                            />
                        </div>

                        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
                            <BasicFormInput
                                label="Date de l'evenement"
                                type="datetime-local"
                                id="form-date"
                                name="date"
                                placeholder=""
                                title="Date de l'evenement"
                                form={form}
                                validation={{
                                    required: "champ obligatoire",
                                    // validate: value => {
                                    //     let now = Date.now();
                                    //     value = Date.parse(value);
                                    //     let age = new Date(now - value).getFullYear() - 1970;
                                    //     if (age < 18) {
                                    //         return t(errors + 'mustBeAdult');
                                    //     }
                                    //     return true;
                                    // },
                                }}
                            />

                            <BasicFormInput
                                label="Date de publication"
                                type="datetime-local"
                                id="form-publishedAt"
                                name="publishedAt"
                                placeholder=""
                                defaultValue={getToday()}

                                title="Date de publication"
                                form={form}
                                validation={{
                                    required: "champ obligatoire",
                                    // validate: value => {
                                    //     let now = Date.now();
                                    //     value = Date.parse(value);
                                    //     let age = new Date(now - value).getFullYear() - 1970;
                                    //     if (age < 18) {
                                    //         return t(errors + 'mustBeAdult');
                                    //     }
                                    //     return true;
                                    // },
                                }}
                            />
                        </div>


                        <div className="flex flex-col w-full md:flex-row md:justify-between md:gap-20">
                            <BasicFormInput
                                label="Duree de l'evenement en minutes"
                                id="form-duration"
                                placeholder="ex: 60"
                                title="Duree de l'evenement en minutes"
                                form={form}
                                name="duration"
                                validation={{
                                    required: "champ obligatoire",
                                    pattern: {
                                        value: /^[0-9]*$/,
                                        message: "uniquement un nombre",
                                    },
                                    min: {
                                        value: 1,
                                        message: "Minimum 1 minute",
                                    },
                                }}
                            />

                            <BasicFormInput
                                label="Nombre de places"
                                id="form-capacity"
                                placeholder="Minimum 1"
                                title="Nombre de places"
                                form={form}
                                name="capacity"
                                // defaultValue="0"
                                validation={{
                                    required: "champ obligatoire",
                                    pattern: {
                                        value: /^[0-9]*$/,
                                        message: "uniquement un nombre",
                                    },
                                    // min: {
                                    //     value: 1,
                                    //     message: "Minimum 1 place",
                                    // },
                                }}
                            />
                        </div>

                        <div className="flex flex-col items-center w-full md:flex-row md:justify-between md:gap-20">
                            <FormTextArea
                                className=""
                                label="Description de l'evenement"
                                maxCount={1000}
                                id="form-description"
                                placeholder=""
                                title="Description de l'evenement"
                                form={form}
                                name="description"
                                validation={{
                                    maxLength: {
                                        value: 1000,
                                        message: "Maximum 1000 caracteres",
                                    },
                                }}
                            />

                        </div>

                    </FormSection>



                    <button
                        className="flex justify-center items-center border p-3 w-1/3 rounded-md bg-accent border-red-500 uppercase cursor-pointer font-bold hover:bg-red-600 transition-all disabled:bg-primary disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <AiOutlineLoading3Quarters className="animate-spin size-6" />
                        ) : (
                            "Valider"
                        )}
                    </button>
                </form>
            </div>

        </>



    );
}

export default EventsCreateManagerPage;
