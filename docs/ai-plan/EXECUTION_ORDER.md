# Execution Order

1. **Craftline**
   - *Justification:* Standalone Remix app with extensions. A good baseline to verify standard package constraints and tooling upgrades in-place.
2. **FixitCSV**
   - *Justification:* Simple embedded admin app, easy validation path after Craftline.
3. **Stagewise**
   - *Justification:* Follows similar structure to FixitCSV, minimal risk.
4. **customsready**
   - *Justification:* Higher complexity due to Redis/BullMQ. Better tackled after standard repairs are proven stable. Require bypass or conditional local config for Redis.
5. **poref**
   - *Justification:* Rebuild process requires fresh scaffold. Lower priority than existing repairs.
6. **QuoteLoop**
   - *Justification:* The most obsolete logic. High rewrite intensity. Deferred to the end of processing.
