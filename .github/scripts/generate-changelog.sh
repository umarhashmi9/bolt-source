#!/usr/bin/env bash

# Ensure we're running in bash
if [ -z "$BASH_VERSION" ]; then
    echo "This script requires bash. Please run with: bash $0" >&2
    exit 1
fi

# Ensure we're using bash 4.0 or later for associative arrays
if ((BASH_VERSINFO[0] < 4)); then
    echo "This script requires bash version 4 or later" >&2
    echo "Current bash version: $BASH_VERSION" >&2
    exit 1
fi

# Set default values for required environment variables if not in GitHub Actions
if [ -z "$GITHUB_ACTIONS" ]; then
    : "${GITHUB_SERVER_URL:=https://github.com}"
    # : "${GITHUB_REPOSITORY:=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[\/:]\(.*\)\.git/\1/')}"
    # : "${NEW_VERSION:=0.0.2}"
    : "${GITHUB_OUTPUT:=/tmp/github_output}"
    touch "$GITHUB_OUTPUT"
fi

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Start changelog file
echo "# Release v${NEW_VERSION}" > changelog.md
echo "" >> changelog.md

if [ -z "$LATEST_TAG" ]; then
    echo "### 🎉 First Release" >> changelog.md
    echo "" >> changelog.md
    COMPARE_BASE="$(git rev-list --max-parents=0 HEAD)"
else
    echo "### 🔄 Changes since $LATEST_TAG" >> changelog.md
    echo "" >> changelog.md
    COMPARE_BASE="$LATEST_TAG"
fi

# Function to extract conventional commit type
get_commit_type() {
    local msg="$1"
    if [[ $msg =~ ^feat:|^feature: ]]; then echo "Features"
    elif [[ $msg =~ ^fix: ]]; then echo "Bug Fixes"
    elif [[ $msg =~ ^docs: ]]; then echo "Documentation"
    elif [[ $msg =~ ^style: ]]; then echo "Styles"
    elif [[ $msg =~ ^refactor: ]]; then echo "Code Refactoring"
    elif [[ $msg =~ ^perf: ]]; then echo "Performance Improvements"
    elif [[ $msg =~ ^test: ]]; then echo "Tests"
    elif [[ $msg =~ ^build: ]]; then echo "Build System"
    elif [[ $msg =~ ^ci: ]]; then echo "CI"
    elif [[ $msg =~ ^chore: ]]; then echo ""  # Skip chore commits
    else echo "Other Changes"
    fi
}

# Initialize associative arrays
declare -A CATEGORIES
declare -A COMMITS_BY_CATEGORY
declare -A ALL_AUTHORS
declare -A NEW_CONTRIBUTORS

# Get all historical authors before the compare base
while IFS= read -r author; do
    ALL_AUTHORS["$author"]=1
done < <(git log "${COMPARE_BASE}" --pretty=format:"%ae" | sort -u)

# Get PR merge commits since last tag or all commits if no tag exists
while IFS= read -r commit_line; do
    HASH=$(echo "$commit_line" | cut -d'|' -f1)
    MERGE_MSG=$(echo "$commit_line" | cut -d'|' -f2)
    AUTHOR=$(echo "$commit_line" | cut -d'|' -f3)
    AUTHOR_EMAIL=$(echo "$commit_line" | cut -d'|' -f4)
    BODY=$(echo "$commit_line" | cut -d'|' -f5)
    
    # Extract PR number from merge commit message
    if [[ $MERGE_MSG =~ Merge\ pull\ request\ #([0-9]+) ]]; then
        PR_NUM="${BASH_REMATCH[1]}"
        
        # Extract the original PR title from the merge commit body
        PR_TITLE=$(echo "$BODY" | grep -v "^Merge pull request" | head -n 1)
        
        # Check if this is a first-time contributor
        if [ -z "${ALL_AUTHORS[$AUTHOR_EMAIL]}" ]; then
            NEW_CONTRIBUTORS["$AUTHOR"]=1
            ALL_AUTHORS["$AUTHOR_EMAIL"]=1
        fi

        CATEGORY=$(get_commit_type "$PR_TITLE")
        
        if [ -n "$CATEGORY" ]; then  # Only process if category is not empty
            CATEGORIES["$CATEGORY"]=1
            
            GITHUB_USERNAME=$(gh pr view $PR_NUM --json author --jq .author.login)

            if [ -n "$GITHUB_USERNAME" ]; then
                COMMITS_BY_CATEGORY["$CATEGORY"]+="- ${PR_TITLE#*: } ([#$PR_NUM](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/pull/$PR_NUM)) [@$GITHUB_USERNAME](https://github.com/$GITHUB_USERNAME)"$'\n'
            else
                COMMITS_BY_CATEGORY["$CATEGORY"]+="- ${PR_TITLE#*: } ([#$PR_NUM](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/pull/$PR_NUM))"$'\n'
            fi
        fi
    fi
done < <(git log "${COMPARE_BASE}..HEAD" --merges --pretty=format:"%H|%s|%aE|%ae|%b" --reverse)

# Write categorized commits to changelog
for category in "Features" "Bug Fixes" "Documentation" "Styles" "Code Refactoring" "Performance Improvements" "Tests" "Build System" "CI" "Other Changes"; do
    if [ -n "${COMMITS_BY_CATEGORY[$category]}" ]; then
        echo "#### $category" >> changelog.md
        echo "" >> changelog.md
        echo "${COMMITS_BY_CATEGORY[$category]}" >> changelog.md
        echo "" >> changelog.md
    fi
done

# Add first-time contributors section if there are any
if [ ${#NEW_CONTRIBUTORS[@]} -gt 0 ]; then
    echo "### 🎉 First-time Contributors" >> changelog.md
    echo "" >> changelog.md
    echo "We extend a warm welcome to our new contributors! Thank you for your first contribution:" >> changelog.md
    echo "" >> changelog.md
    for contributor in "${!NEW_CONTRIBUTORS[@]}"; do
        echo "* [@$contributor](https://github.com/$contributor)" >> changelog.md
    done
    echo "" >> changelog.md
fi

# Add compare link if not first release
if [ -n "$LATEST_TAG" ]; then
    echo "**Full Changelog**: [\`$LATEST_TAG..v${NEW_VERSION}\`](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/compare/$LATEST_TAG...v${NEW_VERSION})" >> changelog.md
fi

# Output the changelog content
CHANGELOG_CONTENT=$(cat changelog.md)
{
    echo "content<<EOF"
    echo "$CHANGELOG_CONTENT"
    echo "EOF"
} >> "$GITHUB_OUTPUT"

# Also print to stdout for local testing
echo "Generated changelog:"
echo "==================="
cat changelog.md
echo "==================="