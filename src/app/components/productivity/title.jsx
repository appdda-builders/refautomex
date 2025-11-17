export default function Title({title, back, path, icon: Icon}){
    return (
        <div className="px-6 lg:px-8">
            <div className="mx-auto max-w-7xl relative">
                <dt className="text-xl font-bold leading-7 gradient-text-title pl-16 pt-5">
                    <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-2xl">
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {title}
                </dt>
                <a href={path} className="text-[rgb(var(--color-text))] px-16">{back}</a>
            </div>
        </div>
    )
}