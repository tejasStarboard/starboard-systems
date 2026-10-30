# Domain: geography

|           |                                             |
| --------- | ------------------------------------------- |
| Service   | `services/geography`                        |
| Schema    | `geo.*`                                     |
| Contracts | `@starboard/contracts` geography            |
| Status    | Currencies + ports search; locations unused |

## Owns

Countries, states, cities, ports (UN/LOCODE), locations, currencies.

## APIs

- `GET/POST /currencies` — list / ensure currency codes (service token)
- `GET /ports?q=` — search ports by UN/LOCODE prefix (service token); empty `q` returns capped list
- `GET /health` — open

## Next tickets

Locations / geocoding beyond ports are deferred.
