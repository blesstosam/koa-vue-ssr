export function fetchItem(id) {
  return new Promise((resolve) => {
    resolve({ id, data: { name: 'sam', age: 18 } })
  })
}