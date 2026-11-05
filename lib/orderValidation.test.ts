import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMenuItemForOrder, validatePublicOrderItems } from './orderValidation'

test('rejects an empty item list', () => {
  assert.deepEqual(validatePublicOrderItems([]), {
    valid: false,
    error: 'Items are required',
  })
})

test('rejects missing menu item IDs', () => {
  assert.deepEqual(validatePublicOrderItems([{ qty: 1 }]), {
    valid: false,
    error: 'Each item must include a menu item ID',
  })
})

for (const qty of [0, -1, 1.5, '2', null]) {
  test(`rejects invalid quantity ${String(qty)}`, () => {
    assert.deepEqual(validatePublicOrderItems([{ menuItemId: 'item-1', qty }]), {
      valid: false,
      error: 'Each item quantity must be a positive integer',
    })
  })
}

test('rejects a non-object order item', () => {
  assert.deepEqual(validatePublicOrderItems([null]), {
    valid: false,
    error: 'Each item must include a menu item ID',
  })
})

test('rejects non-string variants and notes', () => {
  assert.deepEqual(validatePublicOrderItems([{
    menuItemId: 'item-1',
    variantId: 12,
    qty: 1,
  }]), {
    valid: false,
    error: 'Variant ID must be a string',
  })

  assert.deepEqual(validatePublicOrderItems([{
    menuItemId: 'item-1',
    qty: 1,
    itemNotes: 12,
  }]), {
    valid: false,
    error: 'Item notes must be a string',
  })
})

test('accepts valid items with an optional variant and note', () => {
  assert.deepEqual(validatePublicOrderItems([{
    menuItemId: 'item-1',
    variantId: 'variant-1',
    qty: 2,
    itemNotes: 'Less spicy',
  }]), {
    valid: true,
    items: [{
      menuItemId: 'item-1',
      variantId: 'variant-1',
      qty: 2,
      itemNotes: 'Less spicy',
    }],
  })
})

const menuItem = {
  outletId: 'outlet-1',
  isAvailable: true,
  variants: [{ id: 'variant-1' }],
}

test('rejects menu items from another outlet', () => {
  assert.deepEqual(validateMenuItemForOrder(menuItem, 'outlet-2', null), {
    valid: false,
    error: 'Menu item is invalid',
  })
})

test('rejects unavailable menu items', () => {
  assert.deepEqual(validateMenuItemForOrder({ ...menuItem, isAvailable: false }, 'outlet-1', null), {
    valid: false,
    error: 'Menu item is not available',
  })
})

test('rejects variants that do not belong to the menu item', () => {
  assert.deepEqual(validateMenuItemForOrder(menuItem, 'outlet-1', 'other-variant'), {
    valid: false,
    error: 'Menu variant is invalid',
  })
})

test('accepts an available menu item with one of its variants', () => {
  assert.deepEqual(validateMenuItemForOrder(menuItem, 'outlet-1', 'variant-1'), { valid: true })
})
