export type PublicOrderItemInput = {
  menuItemId?: unknown
  variantId?: unknown
  qty?: unknown
  itemNotes?: unknown
}

type ValidatedOrderItem = {
  menuItemId: string
  variantId: string | null
  qty: number
  itemNotes: string | null
}

export type OrderValidationResult =
  | { valid: true; items: ValidatedOrderItem[] }
  | { valid: false; error: string }

export function validateMenuItemForOrder(
  menuItem: { outletId: string; isAvailable: boolean; variants: Array<{ id: string }> } | null,
  outletId: string,
  variantId: string | null
): { valid: true } | { valid: false; error: string } {
  if (!menuItem || menuItem.outletId !== outletId) {
    return { valid: false, error: 'Menu item is invalid' }
  }

  if (!menuItem.isAvailable) {
    return { valid: false, error: 'Menu item is not available' }
  }

  if (variantId && !menuItem.variants.some(({ id }) => id === variantId)) {
    return { valid: false, error: 'Menu variant is invalid' }
  }

  return { valid: true }
}

export function validatePublicOrderItems(input: unknown): OrderValidationResult {
  if (!Array.isArray(input) || input.length === 0) {
    return { valid: false, error: 'Items are required' }
  }

  const items: ValidatedOrderItem[] = []

  for (const rawItem of input as PublicOrderItemInput[]) {
    if (!rawItem || typeof rawItem.menuItemId !== 'string' || rawItem.menuItemId.length === 0) {
      return { valid: false, error: 'Each item must include a menu item ID' }
    }

    if (!Number.isInteger(rawItem.qty) || (rawItem.qty as number) <= 0) {
      return { valid: false, error: 'Each item quantity must be a positive integer' }
    }

    if (
      rawItem.variantId !== undefined &&
      rawItem.variantId !== null &&
      typeof rawItem.variantId !== 'string'
    ) {
      return { valid: false, error: 'Variant ID must be a string' }
    }

    if (
      rawItem.itemNotes !== undefined &&
      rawItem.itemNotes !== null &&
      typeof rawItem.itemNotes !== 'string'
    ) {
      return { valid: false, error: 'Item notes must be a string' }
    }

    items.push({
      menuItemId: rawItem.menuItemId,
      variantId: rawItem.variantId as string | null | undefined ?? null,
      qty: rawItem.qty as number,
      itemNotes: rawItem.itemNotes as string | null | undefined ?? null,
    })
  }

  return { valid: true, items }
}
