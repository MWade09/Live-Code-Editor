# Development Rules & Guidelines

## 🎯 Core Development Principles

### 1. Checklist-Driven Development
- ALWAYS consult project checklists before starting work:
  - `docs/TODO.md`
  - `WEBSITE_EDITOR_INTEGRATION_STRATEGY_TODO.md`
  - `WEBSITE_IMPLEMENTATION_PLAN.md` (when relevant)
- Check off completed items with `[x]` in the source checklist where the work is tracked (prefer the strategy TODO for website↔editor work)
- Only work on items from the current focus unless explicitly agreed otherwise
- Update the relevant checklist immediately when scope changes

### 2. Changelog Documentation
- EVERY meaningful change should be documented in `docs/changelog.md`
- Use semantic versioning and clear descriptions
- Include both technical changes and user-facing improvements
- Follow the established changelog format (see CHANGELOG_FORMAT.md)

### 3. Phase-Based Development
- **Current Focus**: Guest Trial Mode + Project Sync (Phase 3 foundation)
- Complete phases sequentially unless there's a specific reason to jump ahead
- Each phase should be fully functional before moving to the next

## 📝 Documentation Requirements

### Code Documentation
- Add comments for complex logic
- Document all new functions and classes
- Include JSDoc comments for public APIs
- Maintain README.md with setup instructions

### Change Documentation
- Update `docs/changelog.md` for significant changes
- Update `WEBSITE_EDITOR_INTEGRATION_STRATEGY_TODO.md` checkboxes as soon as items are completed
- Include version numbers and dates
- Categorize changes (Added, Changed, Fixed, Removed)
- Reference TODO items that were completed

## 🔧 Technical Standards

### Code Quality
- Use consistent coding style (existing codebase style)
- Test new features before marking TODO items complete
- Ensure cross-browser compatibility
- Optimize for performance

### File Organization
- Follow existing directory structure
- Use descriptive file names
- Keep related functionality together
- Maintain clean separation of concerns

### Error Handling
- Implement proper error handling for all new features
- Provide user-friendly error messages
- Log errors for debugging purposes
- Graceful degradation when features fail

## 🚀 Development Workflow

### Before Starting Work
1. Review current focus in `WEBSITE_EDITOR_INTEGRRATION_STRATEGY_TODO.md` and `docs/TODO.md`
2. Identify next priority item
3. Check if any dependencies need to be completed first
4. Plan the implementation approach

### During Development
1. Focus on one checklist item at a time
2. Test thoroughly as you build
3. Update comments and documentation
4. Consider impact on existing features
5. Keep checklists in sync (mark in-progress / done)

### After Completing Work
1. Mark the checklist item as complete `[x]` in the authoritative doc
2. Update `docs/changelog.md` with changes (when user-facing or architectural)
3. Test the feature end-to-end
4. Verify no existing functionality was broken

## 📌 Progress Tracking Discipline

- Use checkboxes in `WEBSITE_EDITOR_INTEGRATION_STRATEGY_TODO.md` to reflect real status in near-real time
- Prefer granular, verifiable acceptance criteria per milestone
- Keep navigation to try/guest paths and middleware allowlists documented in the strategy file
- When a user manually checks items, treat those as source of truth and continue the sequence from there

## 🎨 UI/UX Guidelines

### Design Consistency
- Maintain existing design language
- Use consistent color scheme and typography
- Follow accessibility best practices
- Ensure responsive design

### User Experience
- Prioritize intuitive interfaces
- Provide clear feedback for user actions
- Implement loading states for async operations
- Handle edge cases gracefully

## 🤖 AI Integration Guidelines

### Context Management
- Provide relevant context to AI systems
- Maintain conversation history appropriately
- Optimize API calls for performance
- Handle AI service failures gracefully

### Feature Development
- Build AI features incrementally
- Test with various AI models
- Provide fallbacks when AI is unavailable
- Respect user privacy and data handling

## 📊 Quality Assurance

### Testing Requirements
- Test new features across different browsers
- Verify mobile responsiveness
- Test with different file types and sizes
- Validate error scenarios

### Performance Considerations
- Monitor bundle size and loading times
- Optimize CodeMirror performance
- Minimize API calls where possible
- Implement efficient caching strategies

## 🔄 Version Control

### Commit Standards
- Use descriptive commit messages
- Reference TODO items in commits
- Make atomic commits for single features
- Maintain clean commit history

### Branching Strategy
- Work on feature branches when appropriate
- Keep main branch stable
- Document significant architectural changes

## 📋 Review Checklist

Before marking any TODO item complete, verify:
- [ ] Feature works as intended
- [ ] No existing functionality is broken
- [ ] Code is documented appropriately
- [ ] Changelog is updated
- [ ] TODO item is marked complete
- [ ] Changes follow established patterns
- [ ] Error handling is implemented
- [ ] UI/UX is consistent with existing design

## 🎯 Phase-Specific Rules

### Phase 1: Enhanced Editor Experience (historical)
- Focus on core editing functionality
- Prioritize stability over advanced features
- Ensure smooth integration with existing codebase
- Build foundation for future AI features

### Phase 2: Advanced AI Integration (historical)
- Implement AI features incrementally
- Maintain compatibility with existing chat system
- Focus on user experience and performance
- Prepare infrastructure for advanced AI workflows

### Phase 3: Project Management & Workflow
- Build on established editor foundation
- Integrate smoothly with existing file management
- Consider scalability for larger projects
- Maintain performance with increased functionality

### Phase 4: Advanced Features & Polish
- Focus on completing the vision
- Ensure all features work together seamlessly
- Optimize performance across all features
- Prepare for potential public release

## 🚨 Critical Rules

### Never Skip
- TODO.md consultation before starting work
- Changelog.md updates for significant changes
- Testing of new functionality
- Documentation of complex features

### Always Remember
- This is building towards a Cursor-like experience
- User experience is paramount
- Code quality affects future development speed
- Each phase builds on the previous ones

---

*These rules should be consulted before every development session and followed consistently throughout the project.*
