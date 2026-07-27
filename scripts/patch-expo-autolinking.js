/**
 * @file scripts/patch-expo-autolinking.js
 * Why this exists:
 * Modern macOS GUI applications (like Android Studio) do not inherit the shell PATH variable.
 * During Gradle sync inside Android Studio, Expo's `expo-autolinking-settings` plugin runs several
 * node.js command lines, which fail with process execution errors when node is not found in the path.
 * This script automatically patches the Kotlin source files inside `node_modules` for the
 * expo-gradle-plugin, forcing them to resolve the absolute node path from `local.properties` (which
 * settings.gradle auto-detects and writes). This allows Android Studio GUI Gradle sync to succeed.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

/**
 * Patches a single file by searching for a target string and replacing it.
 * Writes changes to disk only if target string is found and replacement isn't already applied.
 * @param {string} filePath - Absolute path to the file to patch
 * @param {string} target - The exact string to search and replace
 * @param {string} replacement - The new string to replace target with
 */
function patchFile(filePath, target, replacement) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-autolinking] File does not exist: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(replacement)) {
    console.log(`[patch-expo-autolinking] Already patched: ${path.basename(filePath)}`);
    return;
  }

  if (!content.includes(target)) {
    console.warn(`[patch-expo-autolinking] Target not found in ${path.basename(filePath)}. Skipped.`);
    return;
  }

  const updatedContent = content.replace(target, replacement);
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`[patch-expo-autolinking] Successfully patched: ${path.basename(filePath)}`);
}

function run() {
  const pluginDir = path.join(rootDir, 'node_modules/expo-modules-autolinking/android/expo-gradle-plugin');

  // File 1: ExpoAutolinkingSettingsPlugin.kt
  const file1 = path.join(pluginDir, 'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt');
  const target1 = `  private fun getExpoGradlePluginsFile(settings: Settings): File {
    val expoModulesAutolinkingPath =
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
      }.standardOutput.asText.get().trim()

    val expoAutolinkingDir = File(expoModulesAutolinkingPath).parentFile

    return File(
      expoAutolinkingDir,
      "android/expo-gradle-plugin"
    )
  }`;
  const replacement1 = `  private fun getExpoGradlePluginsFile(settings: Settings): File {
    // Why this exists:
    // When Android Studio is launched from the macOS GUI, it does not inherit the terminal's PATH.
    // We must resolve the absolute path of Node.js from local.properties if it was written by
    // settings.gradle, otherwise fallback to "node" which might fail in GUI environments.
    val localProperties = settings.loadLocalProperties()
    val nodeExecutable = localProperties.getProperty("expo.nodeExecutable") ?: localProperties.getProperty("node") ?: "node"

    val expoModulesAutolinkingPath =
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine(nodeExecutable, "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
      }.standardOutput.asText.get().trim()

    val expoAutolinkingDir = File(expoModulesAutolinkingPath).parentFile

    return File(
      expoAutolinkingDir,
      "android/expo-gradle-plugin"
    )
  }`;

  patchFile(file1, target1, replacement1);

  // File 2: ExpoAutolinkingSettingsExtension.kt
  const file2 = path.join(pluginDir, 'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsExtension.kt');
  const target2 = `package expo.modules.plugin

import org.gradle.api.Action
import org.gradle.api.initialization.Settings
import org.gradle.api.initialization.dsl.VersionCatalogBuilder
import org.gradle.api.model.ObjectFactory
import java.io.File
import javax.inject.Inject

open class ExpoAutolinkingSettingsExtension(
  val settings: Settings,
  @Inject val objects: ObjectFactory
) {
  /**
   * The root directory of the react native project.
   * Should be used by projects that don't follow the /android folder structure.
   *
   * Defaults to \`settings.rootDir\`.
   */
  var projectRoot: File = settings.rootDir

  /**
   * Command that should be provided to \`react-native\` to resolve the configuration.
   */
  val rnConfigCommand by lazy {
    val commandBuilder = AutolinkingCommandBuilder()
      .command("react-native-config")
      .useJson()

    if (projectRoot != settings.rootDir) {
      commandBuilder.option("project-root", projectRoot.absolutePath)
      commandBuilder.option("source-dir", settings.rootDir.absolutePath)
    }
    commandBuilder.build()
  }

  /**
   * A list of paths relative to the app's root directory where
   * the autolinking script should search for Expo modules.
   */
  var searchPaths: List<String>? = null

  /**
   * Package names to exclude when looking up for modules.
   */
  var exclude: List<String>? = null

  /**
   * The file pointing to the React Native Gradle plugin.
   */
  val reactNativeGradlePlugin: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(projectRoot)
        env.commandLine("node", "--print", "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }

  /**
   * The file pointing to the React Native root directory.
   */
  val reactNative: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(projectRoot)
        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }`;

  const replacement2 = `package expo.modules.plugin

import expo.modules.plugin.gradle.loadLocalProperties
import org.gradle.api.Action
import org.gradle.api.initialization.Settings
import org.gradle.api.initialization.dsl.VersionCatalogBuilder
import org.gradle.api.model.ObjectFactory
import java.io.File
import javax.inject.Inject

open class ExpoAutolinkingSettingsExtension(
  val settings: Settings,
  @Inject val objects: ObjectFactory
) {
  // Why this exists:
  // We resolve the absolute path of Node.js from local.properties (where settings.gradle
  // auto-discovered and wrote it) so that GUI environments like Android Studio do not
  // fail when executing node processes.
  private val nodeExecutable by lazy {
    val localProperties = settings.loadLocalProperties()
    localProperties.getProperty("expo.nodeExecutable") ?: localProperties.getProperty("node") ?: "node"
  }

  /**
   * The root directory of the react native project.
   * Should be used by projects that don't follow the /android folder structure.
   *
   * Defaults to \`settings.rootDir\`.
   */
  var projectRoot: File = settings.rootDir

  /**
   * Command that should be provided to \`react-native\` to resolve the configuration.
   */
  val rnConfigCommand by lazy {
    val commandBuilder = AutolinkingCommandBuilder()
      .nodePath(nodeExecutable)
      .command("react-native-config")
      .useJson()

    if (projectRoot != settings.rootDir) {
      commandBuilder.option("project-root", projectRoot.absolutePath)
      commandBuilder.option("source-dir", settings.rootDir.absolutePath)
    }
    commandBuilder.build()
  }

  /**
   * A list of paths relative to the app's root directory where
   * the autolinking script should search for Expo modules.
   */
  var searchPaths: List<String>? = null

  /**
   * Package names to exclude when looking up for modules.
   */
  var exclude: List<String>? = null

  /**
   * The file pointing to the React Native Gradle plugin.
   */
  val reactNativeGradlePlugin: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(projectRoot)
        env.commandLine(nodeExecutable, "--print", "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }

  /**
   * The file pointing to the React Native root directory.
   */
  val reactNative: File by lazy {
    File(
      settings.providers.exec { env ->
        env.workingDir(projectRoot)
        env.commandLine(nodeExecutable, "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim(),
    ).parentFile
  }`;

  patchFile(file2, target2, replacement2);

  // File 3: SettingsManager.kt
  const file3 = path.join(pluginDir, 'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt');
  const target3 = `package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.GradleProject
import expo.modules.plugin.gradle.afterAndroidApplicationProject
import expo.modules.plugin.gradle.applyAarProject
import expo.modules.plugin.gradle.applyPlugin
import expo.modules.plugin.gradle.beforeProject
import expo.modules.plugin.gradle.beforeRootProject
import expo.modules.plugin.gradle.linkAarProject
import expo.modules.plugin.gradle.linkBuildDependence
import expo.modules.plugin.gradle.linkLocalMavenRepository
import expo.modules.plugin.gradle.linkMavenRepository
import expo.modules.plugin.gradle.linkPlugin
import expo.modules.plugin.gradle.linkProject
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import expo.modules.plugin.text.withColor
import groovy.lang.Binding
import groovy.lang.GroovyShell
import org.gradle.api.Project
import org.gradle.api.initialization.Settings
import org.gradle.api.logging.Logging
import org.gradle.internal.extensions.core.extra
import java.io.File

class SettingsManager(
  val settings: Settings,
  val projectRoot: File,
  searchPaths: List<String>? = null,
  exclude: List<String>? = null
) {
  private val autolinkingOptions = AutolinkingOptions(
    searchPaths,
    exclude
  )

  private val groovyShell by lazy {
    val binding = Binding()
    binding.setVariable("providers", settings.providers)
    GroovyShell(javaClass.classLoader, binding)
  }

  private val logger by lazy {
    Logging.getLogger(Settings::class.java)
  }

  /**
   * Resolved configuration from \`expo-modules-autolinking\`.
   */
  private val config by lazy {
    val command = AutolinkingCommandBuilder()
      .command("resolve")
      .useJson()
      .useAutolinkingOptions(autolinkingOptions)
      .build()`;

  const replacement3 = `package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.GradleProject
import expo.modules.plugin.gradle.afterAndroidApplicationProject
import expo.modules.plugin.gradle.applyAarProject
import expo.modules.plugin.gradle.applyPlugin
import expo.modules.plugin.gradle.beforeProject
import expo.modules.plugin.gradle.beforeRootProject
import expo.modules.plugin.gradle.linkAarProject
import expo.modules.plugin.gradle.linkBuildDependence
import expo.modules.plugin.gradle.linkLocalMavenRepository
import expo.modules.plugin.gradle.linkMavenRepository
import expo.modules.plugin.gradle.linkPlugin
import expo.modules.plugin.gradle.linkProject
import expo.modules.plugin.gradle.loadLocalProperties
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import expo.modules.plugin.text.withColor
import groovy.lang.Binding
import groovy.lang.GroovyShell
import org.gradle.api.Project
import org.gradle.api.initialization.Settings
import org.gradle.api.logging.Logging
import org.gradle.internal.extensions.core.extra
import java.io.File

class SettingsManager(
  val settings: Settings,
  val projectRoot: File,
  searchPaths: List<String>? = null,
  exclude: List<String>? = null
) {
  // Why this exists:
  // We resolve the absolute path of Node.js from local.properties (where settings.gradle
  // auto-discovered and wrote it) so that GUI environments like Android Studio do not
  // fail when executing node processes.
  private val nodeExecutable by lazy {
    val localProperties = settings.loadLocalProperties()
    localProperties.getProperty("expo.nodeExecutable") ?: localProperties.getProperty("node") ?: "node"
  }

  private val autolinkingOptions = AutolinkingOptions(
    searchPaths,
    exclude
  )

  private val groovyShell by lazy {
    val binding = Binding()
    binding.setVariable("providers", settings.providers)
    GroovyShell(javaClass.classLoader, binding)
  }

  private val logger by lazy {
    Logging.getLogger(Settings::class.java)
  }

  /**
   * Resolved configuration from \`expo-modules-autolinking\`.
   */
  private val config by lazy {
    val command = AutolinkingCommandBuilder()
      .nodePath(nodeExecutable)
      .command("resolve")
      .useJson()
      .useAutolinkingOptions(autolinkingOptions)
      .build()`;

  patchFile(file3, target3, replacement3);

  // File 4: AutolinkingCommandBuilder.kt
  const file4 = path.join(pluginDir, 'expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/AutolinkingCommandBuilder.kt');
  const target4 = `class AutolinkingCommandBuilder {
  /**
   * Command for finding and running \`expo-modules-autolinking\`.
   */
  private val baseCommand = listOf(
    "node",
    "--no-warnings",
    "--eval",
    "require('expo/bin/autolinking')",
    "expo-modules-autolinking"
  )

  private val platform = listOf(
    "--platform",
    "android"
  )

  private var autolinkingCommand = emptyList<String>()
  private var useJson = emptyList<String>()
  private val optionsMap = mutableSetOf<Pair<String, String>>()
  private var searchPaths = emptyList<String>()

  /**
   * Set the autolinking command to run.
   */
  fun command(command: String) = apply {
    autolinkingCommand = listOf(command)
  }

  /**
   * Add an option to the command.
   */
  fun option(key: String, value: String) = apply {
    optionsMap.add(key to value)
  }

  /**
   * Add a list of values as an option to the command.
   */
  fun option(key: String, value: List<String>) = apply {
    value.forEach { optionsMap.add(key to it) }
  }

  /**
   * Whether it should output json.
   */
  fun useJson() = apply {
    useJson = listOf("--json")
  }

  /**
   * Set the search paths for the autolinking script.
   */
  fun searchPaths(paths: List<String>) = apply {
    searchPaths = paths
  }

  fun useAutolinkingOptions(autolinkingOptions: AutolinkingOptions) = apply {
    autolinkingOptions.exclude?.let { option(EXCLUDE_KEY, it) }
    autolinkingOptions.searchPaths?.let { searchPaths(it) }
  }

  fun build(): List<String> {
    val command = baseCommand +
      autolinkingCommand +
      platform +
      useJson +
      optionsMap.map { (key, value) -> listOf("--$key", value) }.flatMap { it } +
      searchPaths
    return Os.windowsAwareCommandLine(command)
  }`;

  const replacement4 = `class AutolinkingCommandBuilder {
  /**
   * Path to the Node.js executable. Defaults to "node".
   */
  private var nodePath: String = "node"

  /**
   * Set the path to the Node.js executable.
   */
  fun nodePath(path: String) = apply {
    nodePath = path
  }

  private val platform = listOf(
    "--platform",
    "android"
  )

  private var autolinkingCommand = emptyList<String>()
  private var useJson = emptyList<String>()
  private val optionsMap = mutableSetOf<Pair<String, String>>()
  private var searchPaths = emptyList<String>()

  /**
   * Set the autolinking command to run.
   */
  fun command(command: String) = apply {
    autolinkingCommand = listOf(command)
  }

  /**
   * Add an option to the command.
   */
  fun option(key: String, value: String) = apply {
    optionsMap.add(key to value)
  }

  /**
   * Add a list of values as an option to the command.
   */
  fun option(key: String, value: List<String>) = apply {
    value.forEach { optionsMap.add(key to it) }
  }

  /**
   * Whether it should output json.
   */
  fun useJson() = apply {
    useJson = listOf("--json")
  }

  /**
   * Set the search paths for the autolinking script.
   */
  fun searchPaths(paths: List<String>) = apply {
    searchPaths = paths
  }

  fun useAutolinkingOptions(autolinkingOptions: AutolinkingOptions) = apply {
    autolinkingOptions.exclude?.let { option(EXCLUDE_KEY, it) }
    autolinkingOptions.searchPaths?.let { searchPaths(it) }
  }

  fun build(): List<String> {
    // Why this exists:
    // We construct the base command dynamically using the resolved node path
    // so that we don't fall back to "node" in GUI processes.
    val baseCommand = listOf(
      nodePath,
      "--no-warnings",
      "--eval",
      "require('expo/bin/autolinking')",
      "expo-modules-autolinking"
    )
    val command = baseCommand +
      autolinkingCommand +
      platform +
      useJson +
      optionsMap.map { (key, value) -> listOf("--$key", value) }.flatMap { it } +
      searchPaths
    return Os.windowsAwareCommandLine(command)
  }`;

  patchFile(file4, target4, replacement4);

  // File 5: ExpoGradleHelperExtension.kt (in expo-modules-core gradle plugin)
  const file5 = path.join(rootDir, 'node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/gradle/ExpoGradleHelperExtension.kt');
  const target5 = `  fun getReactNativeDir(project: Project): File = synchronized(this) {
    if (::reactNativeDir.isInitialized) {
      return reactNativeDir
    }

    // When building from source, the ReactAndroid project is available
    val reactNativeDirFromSource = project
      .findProject(":packages:react-native:ReactAndroid")
      ?.projectDir
      ?.parentFile

    reactNativeDir = reactNativeDirFromSource ?: File(
      project.providers.exec { env ->
        env.workingDir(project.rootDir)
        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim()
    ).parentFile

    return reactNativeDir
  }`;

  const replacement5 = `  fun getReactNativeDir(project: Project): File = synchronized(this) {
    if (::reactNativeDir.isInitialized) {
      return reactNativeDir
    }

    // When building from source, the ReactAndroid project is available
    val reactNativeDirFromSource = project
      .findProject(":packages:react-native:ReactAndroid")
      ?.projectDir
      ?.parentFile

    // Why this exists:
    // When Android Studio is launched from macOS GUI, it has a restricted PATH that lacks node.
    // We resolve the absolute path of Node.js from local.properties in project.rootDir (android/).
    val localPropertiesFile = File(project.rootDir, "local.properties")
    val properties = Properties()
    if (localPropertiesFile.exists()) {
      localPropertiesFile.reader().use(properties::load)
    }
    val nodeExecutable = properties.getProperty("expo.nodeExecutable") ?: properties.getProperty("node") ?: "node"

    reactNativeDir = reactNativeDirFromSource ?: File(
      project.providers.exec { env ->
        env.workingDir(project.rootDir)
        env.commandLine(nodeExecutable, "--print", "require.resolve('react-native/package.json')")
      }.standardOutput.asText.get().trim()
    ).parentFile

    return reactNativeDir
  }`;

  patchFile(file5, target5, replacement5);

  patchReanimated();
  patchKotlinMetadataVersionChecks();
  patchExpoLibraryTargetSdk();
  patchJsiHeader();
}

/**
 * Bypasses Kotlin metadata compiler compatibility checks across custom build subprojects.
 * Why this exists:
 * Newer Gradle versions (like Gradle 9.4.1) ship with a newer built-in Kotlin Standard Library (2.3.0).
 * Since third-party plugins (like expo-modules-autolinking and react-native-gradle-plugin) are compiled
 * with older Kotlin compiler plugins (e.g. 2.1.20), they fail during compilation with metadata binary
 * incompatibility warnings ("Class 'kotlin.Lazy' was compiled with an incompatible version of Kotlin").
 * Adding the '-Xskip-metadata-version-check' compiler argument instructs the compiler to proceed
 * with compiling the code despite differences in Kotlin metadata version, resolving the build failure safely.
 */
function patchKotlinMetadataVersionChecks() {
  // Patch File 1: node_modules/expo-modules-autolinking/android/expo-gradle-plugin/build.gradle.kts
  const file1 = path.join(rootDir, 'node_modules/expo-modules-autolinking/android/expo-gradle-plugin/build.gradle.kts');
  const target1 = `plugins {
  kotlin("jvm") version "2.1.20" apply false
  id("java-gradle-plugin")
}`;
  const replacement1 = `plugins {
  kotlin("jvm") version "2.1.20" apply false
  id("java-gradle-plugin")
}

allprojects {
  tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
      freeCompilerArgs.add("-Xskip-metadata-version-check")
    }
  }
}`;
  patchFile(file1, target1, replacement1);

  // Patch File 2: node_modules/@react-native/gradle-plugin/build.gradle.kts
  const file2 = path.join(rootDir, 'node_modules/@react-native/gradle-plugin/build.gradle.kts');
  const target2 = `allprojects { tasks.withType<com.ncorti.ktfmt.gradle.tasks.KtfmtCheckTask>() { enabled = false } }`;
  const replacement2 = `allprojects { tasks.withType<com.ncorti.ktfmt.gradle.tasks.KtfmtCheckTask>() { enabled = false } }

allprojects {
  tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
    compilerOptions {
      freeCompilerArgs.add("-Xskip-metadata-version-check")
    }
  }
}`;
  patchFile(file2, target2, replacement2);

  // Patch File 3: node_modules/expo-modules-core/expo-module-gradle-plugin/build.gradle.kts
  const file3 = path.join(rootDir, 'node_modules/expo-modules-core/expo-module-gradle-plugin/build.gradle.kts');
  const target3 = `tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
  }
}`;
  const replacement3 = `tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
    freeCompilerArgs.add("-Xskip-metadata-version-check")
  }
}`;
  patchFile(file3, target3, replacement3);

  // Patch File 4: node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin/build.gradle.kts
  const file4 = path.join(rootDir, 'node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin/build.gradle.kts');
  const target4 = `tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
  }
}`;
  const replacement4 = `tasks.withType<KotlinCompile> {
  compilerOptions {
    jvmTarget.set(JvmTarget.JVM_11)
    freeCompilerArgs.add("-Xskip-metadata-version-check")
  }
}`;
  patchFile(file4, target4, replacement4);
}

/**
 * Patches the react-native-reanimated build.gradle file to use the resolved node executable from local.properties.
 * Why this exists:
 * Reanimated has multiple hardcoded "node" executions that fail under restricted macOS GUI environments.
 */
function patchReanimated() {
  const filePath = path.join(rootDir, 'node_modules/react-native-reanimated/android/build.gradle');
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-autolinking] File does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('def resolveNodeExecutable()')) {
    console.log(`[patch-expo-autolinking] Already patched: react-native-reanimated build.gradle`);
    return;
  }

  const targets = [
    {
      target: `def safeAppExtGet(prop, fallback) {
    def appProject = rootProject.allprojects.find { it.plugins.hasPlugin('com.android.application') }
    appProject?.ext?.has(prop) ? appProject.ext.get(prop) : fallback
}`,
      replacement: `def safeAppExtGet(prop, fallback) {
    def appProject = rootProject.allprojects.find { it.plugins.hasPlugin('com.android.application') }
    appProject?.ext?.has(prop) ? appProject.ext.get(prop) : fallback
}

def resolveNodeExecutable() {
    // Why this exists:
    // When Android Studio is launched from macOS GUI, it has a restricted PATH that lacks node.
    // We resolve the absolute path of Node.js from local.properties if it is available.
    def localPropertiesFile = new File(rootDir, "local.properties")
    def nodeExecutable = "node"
    if (localPropertiesFile.exists()) {
        def localProperties = new Properties()
        localPropertiesFile.withInputStream { localProperties.load(it) }
        nodeExecutable = localProperties.getProperty("expo.nodeExecutable") ?: localProperties.getProperty("node") ?: "node"
    }
    return nodeExecutable
}`
    },
    {
      target: `    // Fallback to node resolver for custom directory structures like monorepos.
    def reactNativePackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine("node", "--print", "require.resolve('react-native/package.json')")
        }.standardOutput.asText.get().trim()
    )`,
      replacement: `    // Fallback to node resolver for custom directory structures like monorepos.
    def reactNativePackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine(resolveNodeExecutable(), "--print", "require.resolve('react-native/package.json')")
        }.standardOutput.asText.get().trim()
    )`
    },
    {
      target: `    // Fallback to node resolver for custom directory structures like monorepos.
    def reactNativeWorkletsPackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine("node", "--print", "require.resolve('react-native-worklets/package.json')")
        }.standardOutput.asText.get().trim()
    )`,
      replacement: `    // Fallback to node resolver for custom directory structures like monorepos.
    def reactNativeWorkletsPackage = file(
        providers.exec {
            workingDir(rootDir)
            commandLine(resolveNodeExecutable(), "--print", "require.resolve('react-native-worklets/package.json')")
        }.standardOutput.asText.get().trim()
    )`
    },
    {
      target: `def validateReactNativeVersionResult = providers.exec {
    workingDir(projectDir.path)
    commandLine("node", "./../scripts/validate-react-native-version.js", REACT_NATIVE_VERSION.toString())
    ignoreExitValue = true
}`,
      replacement: `def validateReactNativeVersionResult = providers.exec {
    workingDir(projectDir.path)
    commandLine(resolveNodeExecutable(), "./../scripts/validate-react-native-version.js", REACT_NATIVE_VERSION.toString())
    ignoreExitValue = true
}`
    },
    {
      target: `def validateWorkletsBuildResult = providers.exec {
    workingDir(projectDir.path)
    commandLine("node", "./../scripts/validate-worklets-build.js")
    ignoreExitValue = true
}`,
      replacement: `def validateWorkletsBuildResult = providers.exec {
    workingDir(projectDir.path)
    commandLine(resolveNodeExecutable(), "./../scripts/validate-worklets-build.js")
    ignoreExitValue = true
}`
    }
  ];

  let modified = false;
  for (const t of targets) {
    if (content.includes(t.target)) {
      content = content.replace(t.target, t.replacement);
      modified = true;
    } else {
      console.warn(`[patch-expo-autolinking] Target not found in react-native-reanimated build.gradle: ${t.target.slice(0, 50)}...`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-expo-autolinking] Successfully patched: react-native-reanimated build.gradle`);
  }
}

/**
 * Patches the expo-module-gradle-plugin to remove the library targetSdk assignment.
 * Why this exists:
 * In Android Gradle Plugin 9.0+, targetSdk is completely removed from LibraryDefaultConfig
 * since targetSdkVersion has no effect on libraries and is only valid for applications.
 * Invoking setTargetSdk(Integer) on modern AGP environments throws a LibraryDefaultConfig
 * method/property missing exception, causing evaluation failures for all Expo module libraries.
 * Skipping the targetSdk assignment for libraries prevents this runtime failure.
 */
function patchExpoLibraryTargetSdk() {
  const filePath = path.join(
    rootDir,
    'node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/android/AndroidLibraryExtension.kt'
  );
  const target = `internal fun LibraryExtension.applySDKVersions(compileSdk: Int, minSdk: Int, targetSdk: Int) {
  this.compileSdk = compileSdk
  defaultConfig {
    this@defaultConfig.minSdk = minSdk
    this@defaultConfig.targetSdk = targetSdk
  }
}`;
  const replacement = `internal fun LibraryExtension.applySDKVersions(compileSdk: Int, minSdk: Int, targetSdk: Int) {
  this.compileSdk = compileSdk
  defaultConfig {
    this@defaultConfig.minSdk = minSdk
    // Why this exists:
    // targetSdk is completely removed from LibraryDefaultConfig in AGP 9.0+,
    // and setting it causes method missing exceptions at runtime.
    // this@defaultConfig.targetSdk = targetSdk
  }
}`;
  patchFile(filePath, target, replacement);
}

/**
 * Patches the react-native JSI header jsi.h to fix compatibility with older C++ standards.
 * Specifically, C++14/C++11 compilers do not have non-const std::string::data(), so we replace
 * buffer.data() with &buffer[0] in toString().
 */
function patchJsiHeader() {
  const filePath = path.join(rootDir, 'node_modules/react-native/ReactCommon/jsi/jsi/jsi.h');
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-autolinking] File does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const target = `  std::string toString() const {
    std::string buffer(36, ' ');
    std::snprintf(
        buffer.data(),
        buffer.size() + 1,`;
  const replacement = `  std::string toString() const {
    std::string buffer(36, ' ');
    std::snprintf(
        &buffer[0],
        buffer.size() + 1,`;

  if (content.includes(replacement)) {
    console.log(`[patch-expo-autolinking] Already patched: react-native jsi.h`);
    return;
  }

  if (!content.includes(target)) {
    console.warn(`[patch-expo-autolinking] Target not found in react-native jsi.h`);
    return;
  }

  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[patch-expo-autolinking] Successfully patched: react-native jsi.h`);
}

run();




