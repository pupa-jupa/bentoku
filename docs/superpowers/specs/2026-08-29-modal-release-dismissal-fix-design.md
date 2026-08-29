# Modal Release Dismissal Fix

## Problem

Toolbar buttons in Infinite mode open their modal on `pointerdown`. The shared modal dismissal controller currently closes the modal when the backdrop receives `pointerup`. If a real click lasts long enough for Phaser to register the newly created backdrop before the mouse button is released, that same release immediately dismisses the modal. The modal therefore appears only while the opening button remains held.

## Root cause

The opening action and outside-dismiss action use opposite halves of the same physical click:

1. The toolbar button handles `pointerdown` and creates the modal.
2. Phaser registers the modal backdrop as interactive on the next frame.
3. The user's `pointerup` occurs over the newly registered backdrop.
4. The shared dismissal handler treats that release as an outside click and closes the modal.

An automated reproduction using `mouse.down()`, a 120 ms delay, and `mouse.up()` confirmed that the modal exists while held and disappears immediately after release.

## Selected fix

Change the shared backdrop dismissal trigger from `pointerup` to `pointerdown`.

The opening `pointerdown` has already been dispatched before the backdrop exists, so it cannot close the new modal. A later, intentional pointer press outside the card still dismisses it immediately. Escape dismissal and event propagation blocking inside the card remain unchanged.

This centralized change fixes Settings, difficulty selection, game history, and every other dismissible modal using `ModalDismissController` without changing the input semantics of unrelated buttons.

## Rejected alternatives

- Delay registration of the `pointerup` handler by one frame. This relies on timing and remains vulnerable to longer presses.
- Convert all modal-opening buttons to `pointerup`. This is a broader behavioral change across multiple button implementations and is unnecessary for the root cause.

## Verification

Add a Playwright regression that performs a realistic press (`mouse.down()`, 120 ms hold, `mouse.up()`) and verifies that both Settings and difficulty modals remain open after release. Existing checks must continue to prove that a subsequent outside click and Escape close the modal.

Run the focused E2E test, the full unit suite, lint, formatting, and production build before committing the implementation.
