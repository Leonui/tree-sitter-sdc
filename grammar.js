// SDC grammar — forked from tree-sitter-tcl with SDC-specific node types:
//   option_flag, sdc_constraint_command, sdc_query_command

const PREC = {
  unary: 150, // - + ~ !
  exp: 140, // **
  muldiv: 130, // * / %
  addsub: 120, // + -
  shift: 110, // << >>
  compare: 100, // > < >= <=
  equal_bool: 90, // == !=
  equal_string: 80, // eq ne
  contain: 70, // in ni
  and_bit: 60, // &
  xor_bit: 50, // ^
  or_bit: 40, // |
  and_logical: 30, // &&
  or_logical: 20, // ||
  ternary: 10, // x ? y : z
};

const interleaved1 = (rule, delim) => seq(rule, repeat(seq(delim, rule)));

const SDC_CONSTRAINT_COMMANDS = [
  'create_clock',
  'create_generated_clock',
  'set_clock_uncertainty',
  'set_input_delay',
  'set_output_delay',
  'set_false_path',
  'set_multicycle_path',
  'set_max_transition',
  'set_max_fanout',
  'set_max_delay',
  'set_min_delay',
  'set_clock_groups',
  'set_clock_latency',
  'set_propagated_clock',
  'group_path',
  'set_load',
  'set_driving_cell',
  'set_input_transition',
  'report_timing',
  'current_design',
  'set_units',
  'set_wire_load_model',
  'set_case_analysis',
  'set_disable_timing',
  'set_clock_transition',
  'set_timing_derate',
  'set_max_capacitance',
  'set_min_capacitance',
  'set_max_area',
  'set_max_dynamic_power',
  'set_max_leakage_power',
  'set_operating_conditions',
  'set_wire_load_mode',
  'set_voltage',
  'set_fanout_load',
  'set_port_fanout_number',
  'set_ideal_network',
  'set_ideal_latency',
  'set_ideal_transition',
  'set_max_time_borrow',
  'set_min_pulse_width',
  'set_data_check',
  'set_sense',
  'set_resistance',
  'set_capacitance',
  'reset_design',
  'set_hierarchy_separator',
  'set_annotated_delay',
  'set_annotated_check',
  'set_max_skew',
  'set_clock_sense',
  'set_logic_dc',
  'set_logic_one',
  'set_logic_zero',
  // environment/design rule commands
  'set_temperature',
  'set_switching_activity',
  'set_slew_derate_from_library',
  // utility commands
  'derive_clock_uncertainty',
];

const SDC_QUERY_COMMANDS = [
  'get_ports',
  'get_pins',
  'get_clocks',
  'get_cells',
  'get_nets',
  'get_lib_cells',
  'get_lib_pins',
  'all_inputs',
  'all_outputs',
  'all_clocks',
  'all_registers',
  'current_instance',
  'get_generated_clocks',
  'get_object_name',
  'get_property',
  'get_attribute',
];

module.exports = grammar({
  name: 'sdc',

  word: $ => $.simple_word,

  externals: $ => [
    $._concat,
    $._immediate,
  ],

  inline: $ => [
    $._builtin,
    $._terminator,
    $._word,
  ],

  extras: $ => [
    /\s+/,
    /\\\r?\n/,
  ],

  rules: {
    source_file: $ => repeat(seq(
      optional($._command),
      $._terminator,
    )),

    _terminator: _ => choice('\n', ';'),

    comment: _ => /#[^\n]*/,

    // --- SDC-specific: option_flag ---
    option_flag: _ => token(prec(1, seq('-', /[a-zA-Z_][a-zA-Z0-9_]*/))),

    // --- SDC-specific: sdc_constraint_command ---
    sdc_constraint_command: $ => seq(
      field('name', alias(choice(...SDC_CONSTRAINT_COMMANDS), $.sdc_command_name)),
      optional(field('arguments', $.word_list)),
    ),

    // --- SDC-specific: sdc_query_command ---
    sdc_query_command: $ => seq(
      field('name', alias(choice(...SDC_QUERY_COMMANDS), $.sdc_query_name)),
      optional(field('arguments', $.word_list)),
    ),

    _builtin: $ => choice(
      $._conditional,
      $.global,
      $.namespace,
      $.procedure,
      $.set,
      $.try,
      $.foreach,
      $.for,
      $.expr_cmd,
      $.while,
      $.catch,
      $.regexp,
      $.switch,
      $.break,
      $.continue,
      $.return,
      $.source,
      $.incr,
      $.puts,
      // SDC-specific builtins
      $.sdc_constraint_command,
      $.sdc_query_command,
    ),

    // regexp ?switches? exp string ?matchVar? ?subMatchVar subMatchVar ...?
    regexp: $ => seq(
      'regexp',
      $._word_simple, // exp
      $._concat_word, // string
      repeat($._concat_word),
    ),

    while: $ => seq('while', $.expr, $._word),

    expr_cmd: $ => seq('expr', $.expr),

    foreach: $ => seq('foreach', $.arguments, $._word_simple, $._word),

    // for {init} {test} {next} {body}
    for: $ => seq('for', $._word, $.expr, $._word, $._word),

    // switch ?flags? value {body}
    switch: $ => seq('switch', optional($.word_list)),

    // control flow keywords
    break: _ => 'break',
    continue: _ => 'continue',
    return: $ => seq('return', optional($.word_list)),

    // source filename
    source: $ => seq('source', field('filename', $._word)),

    // incr var ?increment?
    incr: $ => seq('incr', $._concat_word, optional($._word)),

    // puts ?-nonewline? ?channelId? string
    puts: $ => seq('puts', optional($.word_list)),

    global: $ => seq('global', repeat($._concat_word)),

    namespace: $ => seq('namespace', $.word_list),

    try: $ => seq(
      'try',
      $._word,
      optional(seq(
        'on',
        'error',
        $.arguments,
        $._word,
      )),
      optional($.finally),
    ),

    finally: $=> seq('finally', $._word),

    _command: $ => choice(
      $._builtin,
      $.comment,
      $.command,
    ),

    command: $ => seq(
      field('name', $._word),
      optional(field('arguments', $.word_list)),
    ),

    word_list: $ => repeat1($._word),

    unpack: _ => '{*}',

    _word: $ => seq(
      optional($.unpack),
      choice(
        $.braced_word,
        $._concat_word,
      ),
    ),

    _word_simple: $ => interleaved1(
      choice(
        $.escaped_character,
        $.command_substitution,
        $.simple_word,
        $.quoted_word,
        $.variable_substitution,
        $.braced_word_simple,
        $.option_flag,  // SDC: option flags in word contexts
      ),
      $._concat,
    ),

    _concat_word: $ => interleaved1(
      choice(
        $.escaped_character,
        $.command_substitution,
        seq($.simple_word, optional($.array_index)),
        $.quoted_word,
        $.variable_substitution,
        $.option_flag,  // SDC: option flags in word contexts
      ),
      $._concat,
    ),

    _ns_delim: _ => token.immediate('::'),

    _ident_imm: _ => token.immediate(/[a-zA-Z_][a-zA-Z0-9_]*/),
    _ident: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    _id_immediate: $ => seq(
      optional($._ns_delim), $._ident_imm,
      repeat(seq($._ns_delim, $._ident_imm)),
    ),

    id: $ => seq(
      choice(seq('::', $._ident_imm), $._ident),
      repeat(seq($._ns_delim, $._ident_imm)),
    ),

    array_index: $ => seq(token.immediate('('), $._word_simple, ')'),

    variable_substitution: $ => seq(
      choice(
        seq('$', alias($._id_immediate, $.id)),
        seq('$', '{', /[^}]+/, '}'),
      ),
      optional($.array_index),
    ),

    braced_word: $ => seq('{', optional(seq(
      interleaved1($._command, repeat1($._terminator)),
      repeat($._terminator),
    )), '}'),

    braced_word_simple: $ => seq('{', repeat($._word_simple), '}'),

    set: $ => seq(
      'set',
      choice(
        seq($.id, optional($.array_index)),
        seq('$', '{', /[^}]+/, '}'),
      ),
      optional($._word_simple),
    ),


    procedure: $ => seq(
      'proc',
      field('name', $._word),
      field('arguments', $.arguments),
      field('body', $._word),
    ),

    _argument_word: $ => choice($.simple_word, $.quoted_word, $.braced_word),

    argument: $ => choice(
      field('name', $.simple_word),
      seq(
        '{',
        field('name', $.simple_word),
        optional(field('default', $._argument_word)),
        '}',
      ),
    ),

    arguments: $ => choice(
      seq('{', repeat($.argument), '}'),
      $.simple_word,
    ),

    number: $ => /[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/,
    _boolean: $ => token(choice(
      '1', '0',
      /[Tt][Rr][Uu][Ee]/,
      /[Ff][Aa][Ll][Ss][Ee]/,
    )),

    _expr_atom_no_brace: $ => choice(
      $.number,
      $._boolean,
      seq($.simple_word, '(', $._expr, ')'),
      $.command_substitution,
      $.quoted_word,
      $.variable_substitution,
    ),

    _expr: $ => choice(
      $.unary_expr,
      $.binop_expr,
      $.ternary_expr,
      $.escaped_character,
      seq('(', $._expr, ')'),
      $._expr_atom_no_brace,
      $.braced_word_simple,
    ),

    expr: $ => choice(
      seq('{', $._expr, '}'),
      $._expr_atom_no_brace,
    ),

    unary_expr: $ => prec.left(PREC.unary, seq(choice('-', '+', '~', '!'), $._expr)),

    binop_expr: $ => choice(
      prec.left(PREC.exp, seq($._expr, '**', $._expr)),
      prec.left(PREC.muldiv, seq($._expr, choice('/', '*', '%'), $._expr)),
      prec.left(PREC.addsub, seq($._expr, choice('+', '-'), $._expr)),
      prec.left(PREC.shift, seq($._expr, choice('<<', '>>'), $._expr)),
      prec.left(PREC.compare, seq($._expr, choice('>', '<', '>=', '<='), $._expr)),
      prec.left(PREC.equal_bool, seq($._expr, choice('==', '!='), $._expr)),
      prec.left(PREC.equal_string, seq($._expr, choice('eq', 'ne'), $._expr)),
      prec.left(PREC.contain, seq($._expr, choice('in', 'ni'), $._expr)),
      prec.left(PREC.and_bit, seq($._expr, '&', $._expr)),
      prec.left(PREC.xor_bit, seq($._expr, '^', $._expr)),
      prec.left(PREC.or_bit, seq($._expr, '|', $._expr)),
      prec.left(PREC.and_logical, seq($._expr, '&&', $._expr)),
      prec.left(PREC.or_logical, seq($._expr, '||', $._expr)),
    ),

    ternary_expr: $ => prec.left(PREC.ternary, seq($._expr, '?', $._expr, ':', $._expr)),

    elseif: $ => seq(
      'elseif',
      field('condition', $.expr),
      field('consequence', $._word),
    ),

    else: $ => seq(
      'else',
      field('consequence', $._word),
    ),

    if: $ => seq(
      'if',
      field('condition', $.expr),
      field('consequence', $._word),
      repeat(field('alternative', $.elseif)),
      optional(field('alternative', $.else)),
    ),

    _conditional: $ => choice(
      $.if,
      $.else,
      $.elseif,
    ),

    // catch script ?varName?
    catch: $ => seq(
      'catch',
      $._word,
      optional($._concat_word),
    ),

    quoted_word: $ => seq(
      '"',
      repeat(choice(
        $.variable_substitution,
        $._quoted_word_content,
        $.command_substitution,
        $.escaped_character,
      )),
      '"',
    ),

    escaped_character: _ => /\\./,

    _quoted_word_content: _ => token(prec(-1, /[^$\\\[\]"]+/)),

    command_substitution: $ => seq('[', $._command, ']'),

    simple_word: _ => /[^!$\s\\\[\]{}();"]+/,
  },

});
