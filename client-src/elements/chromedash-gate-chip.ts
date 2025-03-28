import {LitElement, css, html, nothing} from 'lit';
import {SHARED_STYLES} from '../css/shared-css.js';
import {updateURLParams} from './utils';
import {customElement, property} from 'lit/decorators.js';
import {Feature, StageDict} from '../js-src/cs-client.js';

const GATE_STATE_TO_NAME = {
  0: 'Preparing', // PREPARING
  1: 'Not applicable', //  NA
  2: 'Pending', // REVIEW_REQUESTED
  3: 'Pending', // REVIEW_STARTED
  4: 'Needs work', // NEEDS_WORK
  5: 'Approved', // APPROVED
  6: 'Denied', // DENIED
  // TODO(jrobbins): COMPLETE for auto-approved.
  8: 'Internal review', // INTERNAL_REVIEW
  9: 'N/A requested', // NA_REQUESTED
  10: 'N/A (self-certified)', //  NA_SELF
  11: 'N/A (self-certified then verified)', //  NA_VERIFIED
  12: 'No issues found',
};

const GATE_STATE_TO_ICON = {
  0: 'arrow_circle_right_20px', // PREPARING
  //  NA has no icon.
  2: 'pending_20px', // REVIEW_REQUESTED
  3: 'pending_20px', // REVIEW_STARTED
  4: 'autorenew_20px', // NEEDS_WORK
  5: 'check_circle_filled_20px', // APPROVED
  6: 'block_20px', // DENIED
  // TODO(jrobbins): COMPLETE for auto-approved also check_circle_filled_20px.
  // INTERNAL_REVIEW has no icon.
  // NA_SELF has no icon.
  // NA_VERIFIED has no icon.
};

const GATE_STATE_TO_ABBREV = {
  1: 'N/A', //  NA
  8: 'INT', // INTERNAL_REVIEW
  9: 'N/A?', // NA_REQUESTED
  10: 'N/A (self)', //  NA_SELF
  11: 'N/A (ver)', //  NA_VERIFIED
};

export interface GateDict {
  id: number;
  feature_id: number;
  stage_id: number;
  gate_type: number;
  team_name: string;
  gate_name: string;
  escalation_email?: string;
  state: number;
  requested_on?: string;
  responded_on?: string;
  assignee_emails: string[];
  next_action?: string;
  additional_review: boolean;
  slo_initial_response: number;
  slo_initial_response_took: number;
  slo_initial_response_remaining: number;
  slo_resolve: number;
  slo_resolve_took: number;
  slo_resolve_remaining: number;
  needs_work_started_on: string;
  possible_assignee_emails: string[];
  self_certify_possible: boolean;
  self_certify_eligible: boolean;
  survey_answers: {
    is_language_polyfill: boolean;
    is_api_polyfill: boolean;
    is_same_origin_css: boolean;
    launch_or_contact: string;
  };
}

@customElement('chromedash-gate-chip')
class ChromedashGateChip extends LitElement {
  @property({type: Object})
  feature!: Feature;
  @property({type: Object})
  stage!: StageDict;
  @property({type: Object})
  gate!: GateDict;
  @property({type: Number})
  selectedGateId = 0;

  static get styles() {
    return [
      ...SHARED_STYLES,
      css`
        sl-icon {
          font-size: 1.2rem;
        }

        sl-button::part(label) {
          padding: 0 4px;
        }

        sl-button::part(suffix) {
          padding-right: 4px;
        }

        sl-button::part(base) {
          border: var(--chip-border);
          padding: 0 0 0 4px;
          align-items: center;
        }

        sl-button.selected::part(base) {
          box-shadow: 0 0 0 2px var(--dark-spot-color);
        }

        sl-button:hover .teamname {
          text-decoration: underline;
        }

        sl-button.not_applicable::part(base),
        sl-button.na_self-certified::part(base) {
          background: var(--gate-not-applicable-background);
          color: var(--gate-not-applicable-color);
        }
        sl-button.na_self-certified_then_verified::part(base) {
          background: var(--gate-not-applicable-background);
          color: var(--gate-not-applicable-color);
        }
        sl-button.not_applicable::part(prefix),
        sl-button.na_self-certified::part(prefix) {
          align-items: baseline;
        }

        sl-button.preparing::part(base) {
          background: var(--gate-preparing-background);
          color: var(--gate-preparing-color);
        }
        .preparing sl-icon {
          color: var(--gate-preparing-icon-color);
        }

        sl-button.pending::part(base) {
          background: var(--gate-pending-background);
          color: var(--gate-pending-color);
        }
        .pending sl-icon {
          color: var(--gate-pending-icon-color);
        }

        sl-button.needs_work::part(base) {
          background: var(--gate-needs-work-background);
          color: var(--gate-needs-work-color);
        }
        .needs_work sl-icon {
          color: var(--gate-needs-work-icon-color);
        }

        sl-button.approved::part(base) {
          background: var(--gate-approved-background);
          color: var(--gate-approved-color);
        }
        .approved sl-icon {
          color: var(--gate-approved-icon-color);
        }

        sl-button.denied::part(base) {
          background: var(--gate-denied-background);
          color: var(--gate-denied-color);
        }
        .denied sl-icon {
          color: var(--gate-denied-icon-color);
        }

        sl-button.internal_review::part(base) {
          background: var(--gate-pending-background);
          color: var(--gate-pending-color);
        }
        sl-button.internal_review::part(prefix) {
          align-items: baseline;
        }

        sl-button.na_requested::part(base) {
          background: var(--gate-pending-background);
          color: var(--gate-pending-color);
        }
        sl-button.na_requested::part(prefix) {
          align-items: baseline;
        }

        .abbrev {
          padding-left: var(--content-padding-quarter);
          font-weight: 900;
        }

        sl-button sl-icon.overdue {
          color: var(--slo-overdue-color);
        }
      `,
    ];
  }

  _fireEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail,
    });
    this.dispatchEvent(event);
  }

  handleClick() {
    // Add the gate id to the URL.
    updateURLParams('gate', this.gate.id);
    // Handled in chromedash-app.js.
    this._fireEvent('show-gate-column', {
      feature: this.feature,
      stage: this.stage,
      gate: this.gate,
    });
  }

  render() {
    if (this.gate === undefined || this.gate == null) {
      return nothing;
    }
    const teamName = this.gate.team_name;
    const stateName = GATE_STATE_TO_NAME[this.gate.state];
    const className = stateName
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('/', '');
    const selected = this.gate.id == this.selectedGateId ? 'selected' : '';

    const statusIconName = GATE_STATE_TO_ICON[this.gate.state];
    const abbrev = GATE_STATE_TO_ABBREV[this.gate.state] || stateName;
    let statusIcon = html`<b class="abbrev" slot="prefix">${abbrev}</b>`;
    if (statusIconName) {
      statusIcon = html`
        <sl-icon
          slot="prefix"
          library="material"
          name=${statusIconName}
        ></sl-icon>
      `;
    }

    const overdue = this.gate.slo_initial_response_remaining < 0;
    const overdueIcon = overdue
      ? html`<sl-icon
          slot="suffix"
          library="material"
          class="overdue"
          name="clock_loader_60_20px"
        ></sl-icon>`
      : nothing;
    const overdueTitle = overdue ? '. Overdue.' : '';

    return html`
      <sl-button
        pill
        size="small"
        class="${className} ${selected}"
        title="${teamName}: ${stateName}${overdueTitle}"
        @click=${this.handleClick}
      >
        ${statusIcon}
        <span class="teamname">${teamName}</span>
        ${overdueIcon}
      </sl-button>
    `;
  }
}
