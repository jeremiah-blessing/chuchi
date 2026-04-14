"use strict";(()=>{var c=(r=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(r,{get:(t,e)=>(typeof require<"u"?require:t)[e]}):r)(function(r){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+r+'" is not supported')});var O=c("langium"),ie=c("langium/lsp"),d=c("vscode-languageserver/browser.js");var H=c("langium"),K=c("langium/lsp");var E=c("langium");var W="NamedTarget";var U="Obstacle";var z="Step";var N="Charge";function _(r){return i.isInstance(r,N)}var I="Drop";function q(r){return i.isInstance(r,I)}var m="GoTo";function B(r){return i.isInstance(r,m)}var $="Load";function F(r){return i.isInstance(r,$)}var j="Model";var g="ObstacleCell";function T(r){return i.isInstance(r,g)}var h="ObstacleRect";function C(r){return i.isInstance(r,h)}var x="Pickup";function J(r){return i.isInstance(r,x)}var P="Robot";var w="Scan";function Z(r){return i.isInstance(r,w)}var D="Task";var b="Turn";function Q(r){return i.isInstance(r,b)}var k="Unload";function X(r){return i.isInstance(r,k)}var L="Warehouse";var f="WarehouseObject";function M(r){return i.isInstance(r,f)}var S="Waypoint";var R=class extends E.AbstractAstReflection{getAllTypes(){return[N,I,m,$,j,W,U,g,h,x,P,w,z,D,b,k,L,f,S]}computeIsSubtype(t,e){switch(t){case N:case I:case m:case $:case x:case w:case b:case k:return this.isSubtype(z,e);case g:case h:return this.isSubtype(U,e);case f:case S:return this.isSubtype(W,e);default:return!1}}getReferenceType(t){let e=`${t.container.$type}:${t.property}`;switch(e){case"GoTo:targetRef":return W;case"Load:targetRef":case"Pickup:targetRef":case"Scan:targetRef":case"Unload:targetRef":return f;default:throw new Error(`${e} is not a valid reference id.`)}}getTypeMetaData(t){switch(t){case m:return{name:m,properties:[{name:"targetRef"},{name:"x"},{name:"y"}]};case $:return{name:$,properties:[{name:"targetRef"}]};case j:return{name:j,properties:[{name:"objects",defaultValue:[]},{name:"obstacles",defaultValue:[]},{name:"robot"},{name:"tasks",defaultValue:[]},{name:"warehouse"},{name:"waypoints",defaultValue:[]}]};case g:return{name:g,properties:[{name:"x"},{name:"y"}]};case h:return{name:h,properties:[{name:"x1"},{name:"x2"},{name:"y1"},{name:"y2"}]};case x:return{name:x,properties:[{name:"targetRef"}]};case P:return{name:P,properties:[{name:"facing"},{name:"x"},{name:"y"}]};case w:return{name:w,properties:[{name:"targetRef"}]};case D:return{name:D,properties:[{name:"name"},{name:"steps",defaultValue:[]}]};case b:return{name:b,properties:[{name:"direction"}]};case k:return{name:k,properties:[{name:"targetRef"}]};case L:return{name:L,properties:[{name:"height"},{name:"width"}]};case f:return{name:f,properties:[{name:"kind"},{name:"name"},{name:"x"},{name:"y"}]};case S:return{name:S,properties:[{name:"name"},{name:"x"},{name:"y"}]};default:return{name:t,properties:[]}}}},i=new R;var ee=c("langium"),Y,te=()=>Y??(Y=(0,ee.loadGrammarFromJson)(`{
  "$type": "Grammar",
  "isDeclared": true,
  "name": "Chuchi",
  "rules": [
    {
      "$type": "ParserRule",
      "name": "Model",
      "entry": true,
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "warehouse",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@1"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "robot",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@2"
              },
              "arguments": []
            }
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "objects"
              },
              {
                "$type": "Keyword",
                "value": ":"
              },
              {
                "$type": "Assignment",
                "feature": "objects",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@4"
                  },
                  "arguments": []
                },
                "cardinality": "*"
              }
            ]
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "obstacles"
              },
              {
                "$type": "Keyword",
                "value": ":"
              },
              {
                "$type": "Assignment",
                "feature": "obstacles",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@6"
                  },
                  "arguments": []
                },
                "cardinality": "*"
              }
            ]
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "waypoints"
              },
              {
                "$type": "Keyword",
                "value": ":"
              },
              {
                "$type": "Assignment",
                "feature": "waypoints",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@9"
                  },
                  "arguments": []
                },
                "cardinality": "*"
              }
            ]
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": "tasks"
              },
              {
                "$type": "Keyword",
                "value": ":"
              },
              {
                "$type": "Assignment",
                "feature": "tasks",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@10"
                  },
                  "arguments": []
                },
                "cardinality": "*"
              }
            ]
          }
        ],
        "cardinality": "*"
      },
      "definesHiddenTokens": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Warehouse",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "warehouse"
          },
          {
            "$type": "Keyword",
            "value": ":"
          },
          {
            "$type": "Keyword",
            "value": "size"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "width",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "height",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Robot",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "robot"
          },
          {
            "$type": "Keyword",
            "value": ":"
          },
          {
            "$type": "Keyword",
            "value": "start"
          },
          {
            "$type": "Keyword",
            "value": "at"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          },
          {
            "$type": "Keyword",
            "value": "facing"
          },
          {
            "$type": "Assignment",
            "feature": "facing",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@3"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Direction",
      "dataType": "string",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Keyword",
            "value": "left"
          },
          {
            "$type": "Keyword",
            "value": "right"
          },
          {
            "$type": "Keyword",
            "value": "up"
          },
          {
            "$type": "Keyword",
            "value": "down"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "WarehouseObject",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "kind",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@5"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@22"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": "at"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "ObjectKind",
      "dataType": "string",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Keyword",
            "value": "shelf"
          },
          {
            "$type": "Keyword",
            "value": "package"
          },
          {
            "$type": "Keyword",
            "value": "charger"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Obstacle",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@7"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@8"
            },
            "arguments": []
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "ObstacleCell",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Action",
            "inferredType": {
              "$type": "InferredType",
              "name": "ObstacleCell"
            }
          },
          {
            "$type": "Keyword",
            "value": "at"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "ObstacleRect",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Action",
            "inferredType": {
              "$type": "InferredType",
              "name": "ObstacleRect"
            }
          },
          {
            "$type": "Keyword",
            "value": "from"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          },
          {
            "$type": "Keyword",
            "value": "to"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Waypoint",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@22"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": "at"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "x",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "y",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Task",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@22"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ":"
          },
          {
            "$type": "Assignment",
            "feature": "steps",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@11"
              },
              "arguments": []
            },
            "cardinality": "+"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Step",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@12"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@14"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@15"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@16"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@17"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@18"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@19"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@20"
            },
            "arguments": []
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "GoTo",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "goTo"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Alternatives",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "targetRef",
                "operator": "=",
                "terminal": {
                  "$type": "CrossReference",
                  "type": {
                    "$ref": "#/rules@13"
                  },
                  "terminal": {
                    "$type": "RuleCall",
                    "rule": {
                      "$ref": "#/rules@22"
                    },
                    "arguments": []
                  },
                  "deprecatedSyntax": false
                }
              },
              {
                "$type": "Group",
                "elements": [
                  {
                    "$type": "Assignment",
                    "feature": "x",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@23"
                      },
                      "arguments": []
                    }
                  },
                  {
                    "$type": "Keyword",
                    "value": ","
                  },
                  {
                    "$type": "Assignment",
                    "feature": "y",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@23"
                      },
                      "arguments": []
                    }
                  }
                ]
              }
            ]
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "NamedTarget",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@4"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@9"
            },
            "arguments": []
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Turn",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "turn"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "direction",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@3"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Pickup",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "pickup"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "targetRef",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@4"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Drop",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Action",
            "inferredType": {
              "$type": "InferredType",
              "name": "Drop"
            }
          },
          {
            "$type": "Keyword",
            "value": "drop"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Load",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "load"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "targetRef",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@4"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Unload",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "unload"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "targetRef",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@4"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Scan",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "scan"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "targetRef",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@4"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Charge",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Action",
            "inferredType": {
              "$type": "InferredType",
              "name": "Charge"
            }
          },
          {
            "$type": "Keyword",
            "value": "charge"
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "WS",
      "definition": {
        "$type": "RegexToken",
        "regex": "/\\\\s+/"
      },
      "fragment": false
    },
    {
      "$type": "TerminalRule",
      "name": "ID",
      "definition": {
        "$type": "RegexToken",
        "regex": "/[_a-zA-Z][\\\\w_]*/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "name": "INT",
      "type": {
        "$type": "ReturnType",
        "name": "number"
      },
      "definition": {
        "$type": "RegexToken",
        "regex": "/-?[0-9]+/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "ML_COMMENT",
      "definition": {
        "$type": "RegexToken",
        "regex": "/\\\\/\\\\*[\\\\s\\\\S]*?\\\\*\\\\//"
      },
      "fragment": false
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "SL_COMMENT",
      "definition": {
        "$type": "RegexToken",
        "regex": "/\\\\/\\\\/[^\\\\n\\\\r]*/"
      },
      "fragment": false
    }
  ],
  "definesHiddenTokens": false,
  "hiddenTokens": [],
  "imports": [],
  "interfaces": [],
  "types": [],
  "usedGrammars": []
}`));var pe={languageId:"chuchi",fileExtensions:[".chuchi"],caseInsensitive:!1,mode:"development"},re={AstReflection:()=>new R},ae={Grammar:()=>te(),LanguageMetaData:()=>pe,parser:{}};function ne(r){let t=r.validation.ValidationRegistry,e=r.validation.ChuchiValidator,n={Model:e.checkModel,GoTo:e.checkGoTo,Pickup:e.checkPickupIsPackage,Load:e.checkLoadIsShelf,Unload:e.checkUnloadIsShelf};t.register(n,e)}var A=class{constructor(){this.checkModel=(t,e)=>{if(t.robot||e("error","Missing required section 'robot'.",{node:t}),(!t.tasks||t.tasks.length===0)&&e("error","Missing required section 'tasks'.",{node:t}),!t.warehouse){e("error","Missing required section 'warehouse'.",{node:t});return}let{width:n,height:l}=t.warehouse;n<=0&&e("error","Warehouse width must be positive.",{node:t.warehouse,property:"width"}),l<=0&&e("error","Warehouse height must be positive.",{node:t.warehouse,property:"height"});let s=(a,o)=>a>=0&&a<n&&o>=0&&o<l,y=de(t);if(t.robot){let{x:a,y:o}=t.robot;s(a,o)||e("error",`robot start (${a}, ${o}) is outside warehouse bounds (${n} x ${l}).`,{node:t.robot,property:"x"}),y.has(v(a,o))&&e("error",`robot start (${a}, ${o}) is on an obstacle.`,{node:t.robot})}let u=new Map;for(let a of t.objects??[]){s(a.x,a.y)||e("error",`Object '${a.name}' at (${a.x}, ${a.y}) is outside warehouse bounds.`,{node:a}),y.has(v(a.x,a.y))&&e("error",`Object '${a.name}' overlaps an obstacle at (${a.x}, ${a.y}).`,{node:a});let o=v(a.x,a.y),V=u.get(o);V?e("error",`Object '${a.name}' is at the same coordinate as '${V.name}'.`,{node:a}):u.set(o,a)}for(let a of t.waypoints??[])s(a.x,a.y)||e("error",`Waypoint '${a.name}' at (${a.x}, ${a.y}) is outside warehouse bounds.`,{node:a});for(let a of t.obstacles??[])T(a)?s(a.x,a.y)||e("error",`Obstacle at (${a.x}, ${a.y}) is outside warehouse bounds.`,{node:a}):C(a)&&(!s(a.x1,a.y1)||!s(a.x2,a.y2))&&e("error",`Obstacle rectangle from (${a.x1}, ${a.y1}) to (${a.x2}, ${a.y2}) is outside warehouse bounds.`,{node:a});let p=new Map,G=(a,o)=>{p.has(a)?e("error",`Duplicate name '${a}'.`,{node:o,property:"name"}):p.set(a,o)};for(let a of t.objects??[])G(a.name,a);for(let a of t.waypoints??[])G(a.name,a);for(let a of t.tasks??[])G(a.name,a)};this.checkGoTo=(t,e)=>{let n=ce(t);if(!n?.warehouse||t.targetRef)return;let{width:l,height:s}=n.warehouse;(t.x===void 0||t.y===void 0||t.x<0||t.x>=l||t.y<0||t.y>=s)&&e("error",`goTo(${t.x}, ${t.y}) is outside warehouse bounds (${l} x ${s}).`,{node:t})};this.checkPickupIsPackage=(t,e)=>{let n=t.targetRef?.ref;n&&M(n)&&n.kind!=="package"&&e("error",`pickup requires a package, but '${n.name}' is a ${n.kind}.`,{node:t,property:"targetRef"})};this.checkLoadIsShelf=(t,e)=>{let n=t.targetRef?.ref;n&&M(n)&&n.kind!=="shelf"&&e("error",`load requires a shelf, but '${n.name}' is a ${n.kind}.`,{node:t,property:"targetRef"})};this.checkUnloadIsShelf=(t,e)=>{let n=t.targetRef?.ref;n&&M(n)&&n.kind!=="shelf"&&e("error",`unload requires a shelf, but '${n.name}' is a ${n.kind}.`,{node:t,property:"targetRef"})}}},v=(r,t)=>`${r},${t}`;function de(r){let t=new Set;for(let e of r.obstacles??[])if(T(e))t.add(v(e.x,e.y));else if(C(e)){let n=Math.min(e.x1,e.x2),l=Math.max(e.x1,e.x2),s=Math.min(e.y1,e.y2),y=Math.max(e.y1,e.y2);for(let u=n;u<=l;u++)for(let p=s;p<=y;p++)t.add(v(u,p))}return t}function ce(r){let t=r;for(;t&&t.$container;)t=t.$container;return t?.$type==="Model"?t:void 0}var ye={validation:{ChuchiValidator:()=>new A}};function se(r){let t=(0,H.inject)((0,K.createDefaultSharedModule)(r),re),e=(0,H.inject)((0,K.createDefaultModule)({shared:t}),ae,ye);return t.ServiceRegistry.register(e),ne(e),r.connection||t.workspace.ConfigurationProvider.initialized({}),{shared:t,Chuchi:e}}var oe=r=>({warehouse:{width:r.warehouse?.width??0,height:r.warehouse?.height??0},robot:{x:r.robot?.x??0,y:r.robot?.y??0,facing:r.robot?.facing??"right"},objects:(r.objects??[]).map(e=>({name:e.name,kind:e.kind,x:e.x,y:e.y})),obstacles:me(r),waypoints:(r.waypoints??[]).map(e=>({name:e.name,x:e.x,y:e.y})),commands:(r.tasks??[]).flatMap(e=>e.steps.map(fe))}),fe=r=>{if(B(r))return r.targetRef?{type:"goTo",target:{kind:"named",name:r.targetRef.$refText}}:{type:"goTo",target:{kind:"coord",x:r.x,y:r.y}};if(Q(r))return{type:"turn",direction:r.direction};if(J(r))return{type:"pickup",name:r.targetRef.$refText};if(q(r))return{type:"drop"};if(F(r))return{type:"load",name:r.targetRef.$refText};if(X(r))return{type:"unload",name:r.targetRef.$refText};if(Z(r))return{type:"scan",name:r.targetRef.$refText};if(_(r))return{type:"charge"};throw new Error(`Unknown step: ${r?.$type}`)},me=r=>{let t=[];for(let e of r.obstacles??[])if(T(e))t.push({x:e.x,y:e.y});else if(C(e)){let n=Math.min(e.x1,e.x2),l=Math.max(e.x1,e.x2),s=Math.min(e.y1,e.y2),y=Math.max(e.y1,e.y2);for(let u=n;u<=l;u++)for(let p=s;p<=y;p++)t.push({x:u,y:p})}return t};var $e=new d.BrowserMessageReader(self),ge=new d.BrowserMessageWriter(self),le=(0,d.createConnection)($e,ge),{shared:ue,Chuchi:he}=se({connection:le,...O.EmptyFileSystem}),xe=he.serializer.JsonSerializer,we=new d.NotificationType("browser/DocumentChange");ue.workspace.DocumentBuilder.onBuildPhase(O.DocumentState.Validated,r=>{for(let t of r){let e=t.parseResult.value;e.$scene=oe(e),le.sendNotification(we,{uri:t.uri.toString(),content:xe.serialize(e,{sourceText:!0,textRegions:!0}),diagnostics:t.diagnostics??[]})}});(0,ie.startLanguageServer)(ue);})();
