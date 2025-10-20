export default function Title({ title, desc, leyend }) {
    return (
        <div className="lg:text-center mb-10">
            <h2 className="text-base text-slate-700 dark:text-stone-200 font-semibold tracking-wide ">{title}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight gradient-text-title sm:text-4xl">
                {desc}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-200 lg:mx-auto">
                {leyend}
            </p>
        </div>
    )
}