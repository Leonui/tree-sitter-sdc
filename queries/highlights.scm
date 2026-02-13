; SDC / Tcl highlights

; --- Keywords ---
["if" "else" "elseif" "while" "foreach" "for" "proc" "switch" "return"] @keyword
(break) @keyword
(continue) @keyword
["set" "global" "namespace"] @keyword
["try" "catch" "finally"] @keyword

; --- Builtins ---
["expr" "regexp" "source" "incr" "puts"] @function.builtin
(sdc_command_name) @function.builtin
(sdc_query_name) @function.builtin

; --- User-defined ---
(procedure name: (simple_word) @function)
(command name: (simple_word) @function.call)

; --- Literals ---
(comment) @comment
(quoted_word) @string
(number) @number

; --- Variables ---
(variable_substitution) @variable

; --- Flags & operators ---
(option_flag) @attribute
(escaped_character) @string.escape

(unary_expr ["!" "~" "-" "+"] @operator)
(binop_expr ["+" "-" "*" "/" "%" "**" "<<" ">>" ">" "<" ">=" "<=" "==" "!=" "&&" "||" "&" "|" "^" "eq" "ne" "in" "ni"] @operator)
(ternary_expr ["?" ":"] @operator)

; --- Punctuation ---
(command_substitution "[" @punctuation.bracket)
(command_substitution "]" @punctuation.bracket)
(braced_word "{" @punctuation.bracket)
(braced_word "}" @punctuation.bracket)
