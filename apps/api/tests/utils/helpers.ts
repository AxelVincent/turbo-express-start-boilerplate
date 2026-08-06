export function testMessage({
  when,
  then,
}: {
  when: string
  then: string
}): string {
  return `WHEN ${when}, THEN ${then}`
}

export function describeMessage(name: string): string {
  return `[INTEGRATION] ${name}`
}
