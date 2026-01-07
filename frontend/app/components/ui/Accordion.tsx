import * as React from "react"
import { ChevronDown } from "lucide-react"

interface AccordionProps {
    type?: "single" | "multiple"
    defaultValue?: string | string[]
    children: React.ReactNode
    className?: string
}

interface AccordionItemProps {
    value: string
    children: React.ReactNode
    className?: string
}

interface AccordionTriggerProps {
    children: React.ReactNode
    className?: string
}

interface AccordionContentProps {
    children: React.ReactNode
    className?: string
}

const AccordionContext = React.createContext<{
    openItems: string[]
    toggleItem: (value: string) => void
} | null>(null)

export function Accordion({
    type = "single",
    defaultValue,
    children,
    className = "",
}: AccordionProps) {
    const [openItems, setOpenItems] = React.useState<string[]>(() => {
        if (defaultValue) {
            return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
        }
        return []
    })

    const toggleItem = React.useCallback(
        (value: string) => {
            setOpenItems((prev) => {
                if (type === "single") {
                    return prev.includes(value) ? [] : [value]
                }
                return prev.includes(value)
                    ? prev.filter((item) => item !== value)
                    : [...prev, value]
            })
        },
        [type]
    )

    return (
        <AccordionContext.Provider value={{ openItems, toggleItem }}>
            <div className={`space-y-1 ${className}`}>{children}</div>
        </AccordionContext.Provider>
    )
}

export function AccordionItem({ value, children, className = "" }: AccordionItemProps) {
    const context = React.useContext(AccordionContext)
    if (!context) throw new Error("AccordionItem must be used within an Accordion")

    const isOpen = context.openItems.includes(value)

    return (
        <div className={`border border-slate-200 bg-white shadow-sm rounded-sm overflow-hidden ${className}`}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { value, isOpen })
                }
                return child
            })}
        </div>
    )
}

export function AccordionTrigger({ children, className = "", ...props }: AccordionTriggerProps & { value?: string, isOpen?: boolean }) {
    const context = React.useContext(AccordionContext)
    if (!context) throw new Error("AccordionTrigger must be used within an Accordion")

    // These props are injected by AccordionItem
    const { value, isOpen } = props

    return (
        <button
            type="button"
            onClick={() => value && context.toggleItem(value)}
            className={`flex flex-1 items-center justify-between w-full p-4 font-medium transition-all hover:bg-slate-50 text-slate-900 ${isOpen ? "bg-slate-50 text-[#005EAA]" : ""
                } ${className}`}
        >
            {children}
            <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                    }`}
            />
        </button>
    )
}

export function AccordionContent({ children, className = "", ...props }: AccordionContentProps & { isOpen?: boolean }) {
    // These props are injected by AccordionItem
    const { isOpen } = props

    if (!isOpen) return null

    return (
        <div
            className={`overflow-hidden text-sm transition-all animate-in slide-in-from-top-1 duration-200 ${className}`}
        >
            <div className="p-4 pt-0 text-slate-600">{children}</div>
        </div>
    )
}
