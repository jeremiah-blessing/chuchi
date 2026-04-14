grammar Chuchi

entry Model:
    (warehouse=Warehouse
    | robot=Robot
    | ('objects' ':' objects+=WarehouseObject*)
    | ('obstacles' ':' obstacles+=Obstacle*)
    | ('waypoints' ':' waypoints+=Waypoint*)
    | ('tasks' ':' tasks+=Task*))*;

Warehouse:
    'warehouse' ':' 'size' '(' width=INT ',' height=INT ')';

Robot:
    'robot' ':' 'start' 'at' '(' x=INT ',' y=INT ')' 'facing' facing=Direction;

Direction returns string:
    'left' | 'right' | 'up' | 'down';

WarehouseObject:
    kind=ObjectKind name=ID 'at' '(' x=INT ',' y=INT ')';

ObjectKind returns string:
    'shelf' | 'package' | 'charger';

Obstacle:
    ObstacleCell | ObstacleRect;

ObstacleCell:
    {infer ObstacleCell} 'at' '(' x=INT ',' y=INT ')';

ObstacleRect:
    {infer ObstacleRect} 'from' '(' x1=INT ',' y1=INT ')' 'to' '(' x2=INT ',' y2=INT ')';

Waypoint:
    name=ID 'at' '(' x=INT ',' y=INT ')';

Task:
    name=ID ':' steps+=Step+;

Step:
    GoTo | Turn | Pickup | Drop | Load | Unload | Scan | Charge;

GoTo:
    'goTo' '(' (targetRef=[NamedTarget:ID] | x=INT ',' y=INT) ')';

NamedTarget:
    WarehouseObject | Waypoint;

Turn:
    'turn' '(' direction=Direction ')';

Pickup:
    'pickup' '(' targetRef=[WarehouseObject:ID] ')';

Drop:
    {infer Drop} 'drop' '(' ')';

Load:
    'load' '(' targetRef=[WarehouseObject:ID] ')';

Unload:
    'unload' '(' targetRef=[WarehouseObject:ID] ')';

Scan:
    'scan' '(' targetRef=[WarehouseObject:ID] ')';

Charge:
    {infer Charge} 'charge' '(' ')';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /-?[0-9]+/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
