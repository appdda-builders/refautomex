export default function Title({ title, desc, leyend }) {
    return (
        <div className="lg:text-center mb-10">
            <h2 className="text-base text-[rgb(var(--color-text))] font-semibold tracking-wide ">{title}</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight gradient-text-title sm:text-4xl">
                {desc}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-[rgb(var(--color-gray-base))] lg:mx-auto">
                {leyend}
            </p>
        </div>
    )
}