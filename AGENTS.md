<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Paid orders default to pending; fulfillment uses a service-role-only atomic RPC with unique verified payment IDs to prevent replay and key-allocation races.
- Stripe verification checks the configured merchant payment link, exact order reference, buyer email, completed paid status, GBP currency and plan amount; provider failures never grant access.
- PayPal legacy transfers and Xbox codes use explicit authenticated staff verification; Stripe never allows manual approval.
- Source downloads exclude credentials, generated output and raw key-pool literals; deployment values must be configured securely in the destination environment.
