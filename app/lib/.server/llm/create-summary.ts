import { generateText, type CoreTool, type GenerateTextResult, type Message } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { extractCurrentContext, extractPropertiesFromMessage, simplifyBoltActions } from './utils';
import { createScopedLogger } from '~/utils/logger';
import { LLMManager } from '~/lib/modules/llm/manager';

const logger = createScopedLogger('create-summary');

export async function createSummary(props: {
  messages: Message[];
  env?: Env;
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  promptId?: string;
  contextOptimization?: boolean;
  onFinish?: (resp: GenerateTextResult<Record<string, CoreTool<any, any>>, never>) => void;
}) {
  const { messages, env: serverEnv, apiKeys, providerSettings, contextOptimization, onFinish } = props;
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER.name;
  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);
      currentModel = model;
      currentProvider = provider;

      return { ...message, content };
    } else if (message.role == 'assistant') {
      let content = message.content;

      if (contextOptimization) {
        content = simplifyBoltActions(content);
      }

      return { ...message, content };
    }

    return message;
  });

  const provider = PROVIDER_LIST.find((p) => p.name === currentProvider) || DEFAULT_PROVIDER;
  const staticModels = LLMManager.getInstance().getStaticModelListFromProvider(provider);
  let modelDetails = staticModels.find((m) => m.name === currentModel);

  if (!modelDetails) {
    const modelsList = [
      ...(provider.staticModels || []),
      ...(await LLMManager.getInstance().getModelListFromProvider(provider, {
        apiKeys,
        providerSettings,
        serverEnv: serverEnv as any,
      })),
    ];

    if (!modelsList.length) {
      throw new Error(`No models found for provider ${provider.name}`);
    }

    modelDetails = modelsList.find((m) => m.name === currentModel);

    if (!modelDetails) {
      // Fallback to first model
      logger.warn(
        `MODEL [${currentModel}] not found in provider [${provider.name}]. Falling back to first model. ${modelsList[0].name}`,
      );
      modelDetails = modelsList[0];
    }
  }

  let slicedMessages = processedMessages;
  const { summary } = extractCurrentContext(processedMessages);
  let summaryText: string | undefined = undefined;
  let chatId: string | undefined = undefined;

  if (summary && summary.type === 'chatSummary') {
    chatId = summary.chatId;
    summaryText = `Below is the Chat Summary till now, this is chat summary before the conversation provided by the user 
you should also use this as historical message while providing the response to the user.        
${summary.summary}`;

    if (chatId) {
      let index = 0;

      for (let i = 0; i < processedMessages.length; i++) {
        if (processedMessages[i].id === chatId) {
          index = i;
          break;
        }
      }
      slicedMessages = processedMessages.slice(index + 1);
    }
  }

  const extractTextContent = (message: Message) =>
    Array.isArray(message.content)
      ? (message.content.find((item) => item.type === 'text')?.text as string) || ''
      : message.content;

  // select files from the list of code file from the project that might be useful for the current request from the user
  const resp = await generateText({
    system: `
        You are a software engineer. You are working on a project. tou need to summarize the work till now and provide a summary of the chat till now.

        Please only use the following format to generate the summary:
---
# Project Context
- **Project Name**: {project_name}
- **Current Phase**: {phase}
- **Primary Goal**: {brief_description_of_main_objective}

# Conversation History Summary
## Key Discussion Points
- **Last Conversation Topic**: {main_topic_discussed}
- **Decisions Made**: {key_decisions_from_chat}
- **User Preferences**: {user_specified_preferences}
- **Clarifications**: {important_clarifications_made}

## Implementation Context
- **Current Task**: {what_we_are_working_on}
- **Previous Solutions**: {relevant_code_solutions_discussed}
- **Failed Attempts**: {approaches_that_didn't_work}
- **Successful Patterns**: {working_solutions_to_remember}

## User-AI Interaction
- **User's Expertise Level**: {user_technical_background}
- **Communication Style**: {preferred_explanation_level}
- **Special Requirements**: {specific_user_needs}
- **Feedback History**: {what_worked_what_didn't}

# Technical Stack & Environment
- **Languages**: {languages_in_use}
- **Frameworks/Libraries**: {key_dependencies}
- **Development Environment**: {relevant_env_details}
- **Special Configurations**: {any_specific_setup_requirements}

# Current Implementation State
## Active Development
- **Current Feature**: {feature_being_implemented}
- **Code State**: {current_code_status}
- **Blockers**: {current_technical_challenges}
- **Last Working Version**: {last_known_good_state}

## Code Evolution
- **Recent Changes**: {latest_code_modifications}
- **Pending Refactors**: {planned_code_improvements}
- **API Changes**: {api_modifications}
- **Schema Updates**: {data_structure_changes}

# Requirements & Constraints
## Functional Requirements
- **Implemented**: {list_of_implemented_requirements}
- **In Progress**: {current_implementation_focus}
- **Pending**: {upcoming_requirements}

## Technical Constraints
- **Performance**: {performance_requirements}
- **Security**: {security_considerations}
- **Scalability**: {scalability_needs}
- **Compatibility**: {compatibility_requirements}

# Testing & Validation
- **Test Coverage**: {areas_tested}
- **Known Issues**: {documented_bugs_or_limitations}
- **Validation Status**: {current_testing_results}

# Next Steps
- **Immediate Tasks**: {next_implementation_priorities}
- **Planned Changes**: {upcoming_modifications}
- **Open Questions**: {unresolved_technical_questions}

# Context Memory
## Critical Information
- **Must Remember**: {crucial_context_for_future_reference}
- **User Preferences**: {specific_user_requirements_to_maintain}
- **Technical Decisions**: {important_technical_choices_made}

## Error Prevention
- **Known Pitfalls**: {previously_encountered_issues}
- **Avoided Approaches**: {solutions_already_ruled_out}
- **Success Patterns**: {approaches_that_worked_well}

---
Note:
4. Keep entries concise and focused on information needed for continuity


---
        
        RULES:
        * Only provide the whole summary of the chat till now.
        * Do not provide any new information.
        `,
    prompt: `

Here is the previous summary of the chat:
---
${summaryText} 
---

Below is the latest chat:
---
${slicedMessages
  .map((x) => {
    return `---\n[${x.role}] ${extractTextContent(x)}\n---`;
  })
  .join('\n')}
---

Please provide a summary of the chat till now including the hitorical summary of the chat.
`,
    model: provider.getModelInstance({
      model: currentModel,
      serverEnv,
      apiKeys,
      providerSettings,
    }),
  });

  const response = resp.text;

  if (onFinish) {
    onFinish(resp);
  }

  return response;
}
