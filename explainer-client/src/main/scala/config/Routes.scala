package config

object Routes {

  object ExplainEditor {
    val base = "/explain"
    def update(id: Long) = base + s"/update/$id"
  }
}
