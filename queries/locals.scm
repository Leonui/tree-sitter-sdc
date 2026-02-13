; SDC / Tcl locals — variable go-to-definition

; --- Scopes ---
(source_file) @local.scope
(procedure body: (braced_word) @local.scope)
(foreach (braced_word) @local.scope)
(for (braced_word) @local.scope)
(if consequence: (braced_word) @local.scope)
(else consequence: (braced_word) @local.scope)
(while (braced_word) @local.scope)

; --- Definitions ---
(set (id) @local.definition)

; --- References ---
(variable_substitution (id) @local.reference)
