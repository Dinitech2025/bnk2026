"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  searchPlaceholder?: string
  allowCustomValue?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option",
  emptyMessage = "Aucun résultat trouvé",
  className,
  searchPlaceholder = "Rechercher...",
  allowCustomValue = true
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  
  // Quand le composant se monte ou la valeur change, mettre à jour inputValue
  React.useEffect(() => {
    if (open) {
      const option = options.find(opt => opt.value === value)
      setInputValue(option?.label || value || "")
    }
  }, [open, options, value])

  const displayValue = value 
    ? options.find((option) => option.value === value)?.label || value
    : ""

  const handleCreateOption = () => {
    if (inputValue.trim() === "") return
    onChange(inputValue.trim())
    setOpen(false)
  }

  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.value.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [options, inputValue])
  
  const isNewOption = inputValue.trim() !== "" && 
    !options.some(option => 
      option.value.toLowerCase() === inputValue.toLowerCase() || 
      option.label.toLowerCase() === inputValue.toLowerCase()
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between truncate text-left font-normal", className)}
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue} 
            onValueChange={setInputValue}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mx-2 my-2 w-[calc(100%-16px)] justify-start"
                  onClick={handleCreateOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter "{inputValue}"
                </Button>
              ) : (
                <p className="py-6 text-center text-sm">{emptyMessage}</p>
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(selectedValue) => {
                    onChange(selectedValue === value ? "" : selectedValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {allowCustomValue && isNewOption && (
              <>
                <CommandSeparator />
                <CommandItem
                  value={`new-${inputValue}`}
                  onSelect={handleCreateOption}
                  className="font-medium text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter "{inputValue}"
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 
 
 
 
 
 
 