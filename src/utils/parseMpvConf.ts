/**
 * Parse mpv.conf content into a Record of options suitable for libmpv initialOptions.
 *
 * Format: one option per line, `key=value` or `key` (flag). Lines starting with `#` are comments.
 * Options prefixed with `no-` are treated as boolean false flags.
 */
export function parseMpvConf(content: string): Record<string, string | boolean | number> {
    const options: Record<string, string | boolean | number> = {}

    for (const rawLine of content.split('\n')) {
        const line = rawLine.trim()

        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue

        const eqIndex = line.indexOf('=')

        if (eqIndex === -1) {
            // Flag option: `fullscreen` → true, `no-fullscreen` → false
            if (line.startsWith('no-')) {
                options[line.slice(3)] = 'no'
            } else {
                options[line] = 'yes'
            }
        } else {
            const key = line.slice(0, eqIndex).trim()
            const value = line.slice(eqIndex + 1).trim()

            if (!key) continue

            // Try to parse as number
            if (/^-?\d+$/.test(value)) {
                options[key] = parseInt(value, 10)
            } else if (/^-?\d+\.\d+$/.test(value)) {
                options[key] = parseFloat(value)
            } else if (value === 'yes' || value === 'no') {
                options[key] = value
            } else {
                options[key] = value
            }
        }
    }

    return options
}
