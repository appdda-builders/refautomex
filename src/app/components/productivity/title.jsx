import { IoReturnDownBackOutline } from "react-icons/io5";

export default function Title({title, back, path, icon: Icon}){
    return (
        <div className="px-6 lg:px-8">
            <div className="mx-auto max-w-7xl relative">
                <dt className="text-xl font-bold leading-7 gradient-text-title pl-16 pt-5">
                    <div className="absolute left-4 top-7 flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-galaxy))] shadow-2xl animate-pulse">
                        <Icon className="h-6 w-6 text-[rgb(var(--color-text))]" aria-hidden="true" />
                    </div>
                    {title}
                </dt>
                <div className="flex flex-row relative hover:text-[rgb(var(--color-refautomex))] cursor-pointer text-[rgb(var(--color-text))]">
                    <IoReturnDownBackOutline className="absolute left-15 top-1" />
                    <a href={path} className="px-16 pl-20">{back}</a>
                </div>
            </div>
        </div>
    )
}