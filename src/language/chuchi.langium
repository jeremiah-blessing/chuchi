grammar Chuchi

entry Model:
   begin=Begin? actions+=(Move)*;

Begin:
    'begin' '(' x=NUMBER ',' y=NUMBER ')';

Move:
    'move' '(' x=NUMBER ',' y=NUMBER',' type=('walk'|'jump') ')' ;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number:    /(?:(?:-?[0-9]+)?\.[0-9]+)|-?[0-9]+/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
