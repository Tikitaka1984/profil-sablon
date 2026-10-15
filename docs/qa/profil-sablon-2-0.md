# Történelmi Profil Sablon 2.0 – ellenőrzés

Dátum: 2026-10-15. Kiinduló main: 129b68d.

A korábban elkészült PROFIL_SABLON_2_INDEX.html változatból dolgoztunk, újabb felhasználói feltöltés nélkül. A helyi fejlesztési ág neve: feat/profil-sablon-2-0.

## Javítások

- JSON v4 export, v1–v4 import; a v3 formátumú szervezetlisták támogatása.
- Import előtt típus-, méret-, verzió- és adatvesztési ellenőrzés; hibás vagy csonkolást igénylő adatok esetén a jelenlegi munka megmarad.
- Azonnali localStorage mentés, IndexedDB biztonsági mentés, sérült helyi tároló helyreállítása; újabb helyi munka elsőbbsége az azonos időbélyegű biztonsági másolattal szemben.
- Tárolási hiba jelzése és lapelhagyási figyelmeztetés mentetlen munka esetén.
- Képforrások külön mezőkben, megjelenítésük a nyomtatott változatban. Az ellenőrzőlista a forrásmezők kitöltését ellenőrzi; a hivatkozások tartalmi hitelességét és a felhasználási engedélyt a tanár értékeli.
- Képek biztonságos adat-URL formátuma, méretkorlátok; aszinkron képfeldolgozás ne írjon törölt vagy lecserélt tételbe.
- Hozzáférhető űrlapnevek, billentyűzettel kezelhető fülek és portréválasztó; mobilos tördelés, érintési célok.
- A4 PDF: világos nyomtatási színek, tanulói azonosító, forrásjegyzék, hosszú tartalom oldalakra tördelése.

## Eredmények

Chromium 153, Playwright. 12/12 böngészős teszt sikeres:

1. Szerkesztés és azonnali újratöltés: utolsó módosítás megmarad.
2. JSON oda-vissza mentés: szöveg, ékezetek, kép és forrás változatlan.
3. Hibás, idegen, jövőbeli és adatvesztést okozó JSON: elutasítva, munka változatlan.
4. Betöltés megszakítása: munka változatlan.
5. Korábbi v3 mentés: betölthető.
6. Hiányzó képforrás: jelzés; kitöltés után teljesített állapot.
7. Űrlapnevek, nyílbillentyűs fülek, 360/768/1280 px nézet: sikeres, vízszintes túlcsordulás nélkül.
8. Nyomtatási gomb és A4 PDF generálása: sikeres.
9. localStorage törlése után IndexedDB helyreállítás: sikeres.
10. Sérült localStorage és újabb időbélyeg esetén IndexedDB helyreállítás: sikeres.
11. Mindkét tár hibája: látható jelzés, JSON export továbbra is működik.
12. Futás közbeni JavaScript-hibák: 0.

Külön PDF-ellenőrzés: 3 A4 oldal; tanulónév, osztály, II. József neve, képforrás és a 60 bekezdéses tesztszöveg végjelzője jelen van. A három renderelt PDF-oldal és a mobilos előnézet vizuális ellenőrzése megtörtént. A natív nyomtatási párbeszédablak, valódi mobilkészülék és Safari nem volt tesztelve.

Futtatás: `node tests/profile-2-qa.cjs` (Playwright és Chromium szükséges; egyéni binárishoz CHROMIUM_EXECUTABLE). PDF-ellenőrzés: `python tests/profile-pdf-qa.py` (PyMuPDF).

## GitHub-publikálás

Az integráció korábbi 403 hibája után a hozzáférés 2026-10-15-én helyreállt: a fejlesztési ág létrehozása sikeres. A javított forrás és a tesztek ezen az ágon kerülnek PR-be, majd az engedélyezett összevonás után a meglévő main-alapú GitHub Pages publikálásra.

Éles célcím: https://tikitaka1984.github.io/profil-sablon/

A végleges éles ellenőrzés eredményét a PR és a feladat eredményjelentése tartalmazza. A helyi funkcionális eredmények a fenti tesztelt változatra vonatkoznak.
