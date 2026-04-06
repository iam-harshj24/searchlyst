// @ts-nocheck
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"table"> & React.RefAttributes<HTMLTableElement>>}
 */
const Table = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}>
      {children}
    </table>
  </div>
))
Table.displayName = "Table"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"thead"> & React.RefAttributes<HTMLTableSectionElement>>}
 */
const TableHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props}>
    {children}
  </thead>
))
TableHeader.displayName = "TableHeader"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"tbody"> & React.RefAttributes<HTMLTableSectionElement>>}
 */
const TableBody = React.forwardRef(({ className, children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}>
    {children}
  </tbody>
))
TableBody.displayName = "TableBody"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"tfoot"> & React.RefAttributes<HTMLTableSectionElement>>}
 */
const TableFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}>
    {children}
  </tfoot>
))
TableFooter.displayName = "TableFooter"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"tr"> & React.RefAttributes<HTMLTableRowElement>>}
 */
const TableRow = React.forwardRef(({ className, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}>
    {children}
  </tr>
))
TableRow.displayName = "TableRow"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"th"> & React.RefAttributes<HTMLTableCellElement>>}
 */
const TableHead = React.forwardRef(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}>
    {children}
  </th>
))
TableHead.displayName = "TableHead"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"td"> & React.RefAttributes<HTMLTableCellElement>>}
 */
const TableCell = React.forwardRef(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}>
    {children}
  </td>
))
TableCell.displayName = "TableCell"

/**
 * @type {React.ForwardRefExoticComponent<React.ComponentProps<"caption"> & React.RefAttributes<HTMLTableCaptionElement>>}
 */
const TableCaption = React.forwardRef(({ className, children, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}>
    {children}
  </caption>
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
